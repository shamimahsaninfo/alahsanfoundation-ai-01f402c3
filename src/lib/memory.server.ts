// Per-user long-term memory stored in the database (user_memories table).
export type MemoryItem = { id?: string; text: string; kind: string; at: string };

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

export async function loadMemory(userId: string, limit = 80): Promise<MemoryItem[]> {
  const db = await admin();
  const { data, error } = await db.from("user_memories").select("id,text,kind,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).reverse().map((r) => ({ id: r.id, text: r.text, kind: r.kind, at: r.created_at }));
}

export async function addMemory(userId: string, items: { text: string; kind: string }[]) {
  if (!items.length) return;
  const db = await admin();
  const { error } = await db.from("user_memories").insert(items.map((i) => ({ user_id: userId, text: i.text, kind: i.kind })));
  if (error) throw new Error(error.message);
  // keep at most 200 per user
  const { data } = await db.from("user_memories").select("id").eq("user_id", userId).order("created_at", { ascending: false }).range(200, 1000);
  if (data?.length) await db.from("user_memories").delete().in("id", data.map((d) => d.id));
}

export async function deleteMemory(userId: string, id: string) {
  const db = await admin();
  const { error } = await db.from("user_memories").delete().eq("user_id", userId).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Extract only durable facts the user stated about themselves/their work. */
export async function gatekeep(user: string, assistant: string, existing: MemoryItem[]): Promise<{ text: string; kind: string }[]> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return [];
  const prompt = `তুমি একটি কঠোর মেমোরি গেটকিপার। নিচের কথোপকথন থেকে কেবল ব্যবহারকারী নিজে স্পষ্টভাবে বলেছেন এমন দীর্ঘমেয়াদী তথ্য বের করো।
গ্রহণযোগ্য kind: "preference" (পছন্দ/নিয়ম), "profile" (নাম, পেশা, প্রতিষ্ঠান, প্রকল্প), "correction" (এআই-এর ভুল সংশোধন)।
বাতিল: এআই-এর দাবি, সাধারণ জ্ঞান, সাময়িক কাজ, কোড, প্রশ্ন, পাসওয়ার্ড/কী/ব্যাংক তথ্য, পুনরাবৃত্তি। সন্দেহ হলেই বাদ।
ইতিমধ্যে সংরক্ষিত:
${existing.map((m) => "- " + m.text).join("\n") || "(কিছু নেই)"}
ব্যবহারকারী: """${user}"""
এআই: """${assistant.slice(0, 1500)}"""
শুধু JSON: {"facts":[{"text":"এক বাক্যে বাংলায়","kind":"preference|profile|correction"}]}`;
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      reasoning_effort: "low",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_schema", json_schema: { name: "facts", strict: true, schema: { type: "object", additionalProperties: false, required: ["facts"], properties: { facts: { type: "array", items: { type: "object", additionalProperties: false, required: ["text", "kind"], properties: { text: { type: "string" }, kind: { type: "string", enum: ["preference", "profile", "correction"] } } } } } } } },
    }),
    signal: AbortSignal.timeout(20000),
  }).catch(() => null);
  if (!r?.ok) return [];
  try {
    const j = await r.json();
    const parsed = JSON.parse(j.choices?.[0]?.message?.content ?? "{}");
    const seen = new Set(existing.map((m) => m.text.trim()));
    return (Array.isArray(parsed.facts) ? parsed.facts : [])
      .filter((f: any) => typeof f?.text === "string" && ["preference", "profile", "correction"].includes(f.kind))
      .map((f: any) => ({ text: f.text.trim().slice(0, 300), kind: f.kind }))
      .filter((f: { text: string }) => f.text && !seen.has(f.text))
      .slice(0, 5);
  } catch {
    return [];
  }
}
