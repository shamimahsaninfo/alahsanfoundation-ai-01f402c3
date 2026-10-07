// Google Drive-backed long-term memory ("Al-Ahsan-AI-Brain/verified_memory.json").
// Only facts that passed the truth gatekeeper are stored here.
const GW = "https://connector-gateway.lovable.dev/google_drive";
const FOLDER = "Al-Ahsan-AI-Brain";
const FILE = "verified_memory.json";

export type MemoryItem = { text: string; kind: string; at: string };

let cache: { items: MemoryItem[]; fileId: string | null; ts: number } | null = null;

function headers(extra: Record<string, string> = {}) {
  const lk = process.env["LOVABLE_API_KEY"];
  const dk = process.env["GOOGLE_DRIVE_API_KEY"];
  if (!lk || !dk) return null;
  return { Authorization: `Bearer ${lk}`, "X-Connection-Api-Key": dk, ...extra };
}

async function gw(path: string, init: RequestInit = {}) {
  const h = headers((init.headers as Record<string, string>) ?? {});
  if (!h) throw new Error("গুগল ড্রাইভ সংযুক্ত নেই");
  const r = await fetch(`${GW}${path}`, { ...init, headers: h });
  if (!r.ok) {
    const t = await r.text();
    console.error(`Drive request failed [${r.status}]: ${t}`);
    throw new Error(`ড্রাইভ ত্রুটি [${r.status}]: ${t.slice(0, 200)}`);
  }
  return r;
}

async function findOne(q: string): Promise<string | null> {
  const r = await gw(`/drive/v3/files?q=${encodeURIComponent(q + " and trashed=false")}&fields=files(id)&pageSize=1`);
  const j = (await r.json()) as { files?: { id: string }[] };
  return j.files?.[0]?.id ?? null;
}

async function ensureFolder(): Promise<string> {
  const existing = await findOne(`name='${FOLDER}' and mimeType='application/vnd.google-apps.folder'`);
  if (existing) return existing;
  const r = await gw(`/drive/v3/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: FOLDER, mimeType: "application/vnd.google-apps.folder" }),
  });
  return ((await r.json()) as { id: string }).id;
}

export function driveConfigured() {
  return !!headers();
}

export async function loadMemory(force = false): Promise<{ items: MemoryItem[]; fileId: string | null }> {
  if (!force && cache && Date.now() - cache.ts < 60_000) return cache;
  const folder = await ensureFolder();
  const fileId = await findOne(`name='${FILE}' and '${folder}' in parents`);
  let items: MemoryItem[] = [];
  if (fileId) {
    const r = await gw(`/drive/v3/files/${fileId}?alt=media`);
    try {
      const j = JSON.parse(await r.text());
      if (Array.isArray(j?.items)) items = j.items;
    } catch { /* ভাঙা ফাইল হলে খালি ধরে নেওয়া */ }
  }
  cache = { items, fileId, ts: Date.now() };
  return cache;
}

export async function saveMemory(items: MemoryItem[]) {
  const { fileId } = await loadMemory();
  const content = JSON.stringify({ updated_at: new Date().toISOString(), note: "আল আহসান এআই — যাচাইকৃত স্মৃতি। ভুল লাইন মুছে দিলে এআই সেটি আর মানবে না।", items }, null, 2);
  if (fileId) {
    await gw(`/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: content,
    });
    cache = { items, fileId, ts: Date.now() };
    return;
  }
  const folder = await ensureFolder();
  const boundary = "alahsan" + Date.now();
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify({ name: FILE, parents: [folder], mimeType: "application/json" }) +
    `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${content}\r\n--${boundary}--`;
  const r = await gw(`/upload/drive/v3/files?uploadType=multipart&fields=id`, {
    method: "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
  const id = ((await r.json()) as { id: string }).id;
  cache = { items, fileId: id, ts: Date.now() };
}

/** Truth gatekeeper: asks a model to extract only durable, verifiable-by-user facts. */
export async function gatekeep(user: string, assistant: string, existing: MemoryItem[]): Promise<MemoryItem[]> {
  const key = process.env["LOVABLE_API_KEY"];
  const prompt = `তুমি একটি কঠোর "সত্যতা যাচাই গেটকিপার"। নিচের কথোপকথন থেকে কেবল সেই তথ্যগুলো বের করো যা দীর্ঘমেয়াদে মনে রাখার যোগ্য এবং সত্য বলে নিশ্চিত।

গ্রহণযোগ্য (kind):
- "preference": অ্যাডমিন নিজে স্পষ্টভাবে বলেছেন এমন পছন্দ/নিয়ম (যেমন "সবসময় সংক্ষেপে উত্তর দেবে")।
- "project": প্রকল্প/প্রতিষ্ঠান সম্পর্কে অ্যাডমিনের নিজের দেওয়া তথ্য।
- "correction": অ্যাডমিন এআই-এর কোনো ভুল ধরিয়ে দিয়ে সঠিকটা বলেছেন।

কঠোরভাবে বাতিল করবে:
- এআই-এর নিজের দাবি, অনুমান বা সাধারণ জ্ঞান (এআই ভুল করতে পারে, তাই এগুলো কখনো সংরক্ষণ নয়)।
- হাদিস নম্বর, কিতাবের রেফারেন্স, পরিসংখ্যান, তারিখ বা যেকোনো যাচাই-অযোগ্য তথ্যগত দাবি।
- কুশল বিনিময়, সাময়িক কাজ, কোড, প্রশ্ন।
- ইতিমধ্যে সংরক্ষিত তথ্যের পুনরাবৃত্তি বা সংরক্ষিত তথ্যের সাথে সাংঘর্ষিক কিছু (সংঘাত হলে বাদ দাও)।
- সন্দেহ থাকলেই বাদ।

ইতিমধ্যে সংরক্ষিত:
${existing.map((m) => "- " + m.text).join("\n") || "(কিছু নেই)"}

অ্যাডমিন বলেছেন:
"""${user}"""

এআই উত্তর দিয়েছে:
"""${assistant.slice(0, 2000)}"""

শুধু JSON দাও: {"facts":[{"text":"এক বাক্যে বাংলায়","kind":"preference|project|correction"}]} — কিছু না থাকলে {"facts":[]}`;
  // Use the admin's own Google key (free) first; Lovable gateway only as backup.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: k } = await supabaseAdmin.from("ai_keys").select("google_key").eq("id", 1).maybeSingle();
  const gk = k?.google_key?.trim() || process.env["GOOGLE_API_KEY"];
  const req = (url: string, auth: string, model: string) => fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" } }),
  });
  let r = gk
    ? await req("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", gk, "gemini-3.5-flash")
    : new Response("no key", { status: 500 });
  if (!r.ok && key) r = await req("https://ai.gateway.lovable.dev/v1/chat/completions", key, "google/gemini-3-flash-preview");
  if (!r.ok) {
    console.error(`gatekeeper failed [${r.status}]: ${await r.text()}`);
    return [];
  }
  try {
    const j = await r.json();
    const parsed = JSON.parse(j.choices?.[0]?.message?.content ?? "{}");
    const now = new Date().toISOString();
    const seen = new Set(existing.map((m) => m.text.trim()));
    return (Array.isArray(parsed.facts) ? parsed.facts : [])
      .filter((f: any) => typeof f?.text === "string" && ["preference", "project", "correction"].includes(f.kind))
      .map((f: any) => ({ text: f.text.trim().slice(0, 300), kind: f.kind, at: now }))
      .filter((f: MemoryItem) => f.text && !seen.has(f.text))
      .slice(0, 5);
  } catch {
    return [];
  }
}
