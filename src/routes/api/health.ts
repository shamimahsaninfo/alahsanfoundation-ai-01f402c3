import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

// Dynamic diagnostic engine: every probe exercises the real system and only
// reports an Issue when something is actually broken. Unknown exceptions from
// any probe also become issues, so new/unexpected failures surface too.
type Issue = { id: string; area: string; title: string; detail: string; fix?: string; fixLabel?: string };
type Ctx = { admin: any; settings: any; keys: any; issues: Issue[]; passed: string[] };

const FOUNDER = "alahsanfoundation.info@gmail.com";
const GOOGLE_CHAT = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const WORKING_GOOGLE_MODELS = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-3-flash-preview"];
const TINY_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const TABLES = ["ai_settings", "ai_keys", "conversations", "messages", "pages", "health_checks", "chat_usage", "user_roles"];

async function chatCall(url: string, key: string, model: string, content: unknown) {
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${String(key ?? "").replace(/[^\x21-\x7E]/g, "")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "user", content }] }),
    signal: AbortSignal.timeout(25000),
  }).catch((e) => new Response(String(e), { status: 599 }));
  const text = await r.text();
  return { ok: r.ok, status: r.status, text: text.slice(0, 300) };
}

function classify(status: number, text: string) {
  const t = text.toLowerCase();
  if (status === 429 || /rate|quota|exhausted/.test(t)) return "সাময়িক রেট লিমিট (ক্রেডিট শেষ নয়)";
  if (status === 401 || status === 403 || /api key|permission/.test(t)) return "কী অবৈধ বা অনুমতি নেই";
  if (status === 404 || /not found|no longer/.test(t)) return "মডেল আর পাওয়া যায় না";
  if (status === 599) return "নেটওয়ার্ক/টাইমআউট";
  if (status >= 500) return "সেবার সার্ভারে সমস্যা";
  return `ত্রুটি ${status}`;
}

function chatTarget(ctx: Ctx) {
  const provider = ctx.settings?.provider ?? "google";
  const model = ctx.settings?.model ?? "gemini-3.5-flash";
  if (provider === "google") return { url: GOOGLE_CHAT, key: ctx.keys?.google_key?.trim() || process.env["GOOGLE_API_KEY"], model, provider };
  if (provider === "openai") return { url: "https://api.openai.com/v1/chat/completions", key: ctx.keys?.openai_key?.trim(), model, provider };
  return { url: "https://ai.gateway.lovable.dev/v1/chat/completions", key: process.env["LOVABLE_API_KEY"], model, provider };
}

const PROBES: Record<string, (c: Ctx) => Promise<void>> = {
  async database(c) {
    for (const t of TABLES) {
      const { error } = await c.admin.from(t).select("*", { head: true, count: "exact" });
      if (error) c.issues.push({ id: `db:${t}`, area: "ডাটাবেস", title: `"${t}" টেবিল পড়া যাচ্ছে না`, detail: error.message });
    }
    c.passed.push("ডাটাবেস");
  },
  async settings(c) {
    if (!c.settings) return void c.issues.push({ id: "settings:missing", area: "সেটিংস", title: "এআই সেটিংস নেই", detail: "ডিফল্ট সেটিংস তৈরি করা দরকার", fix: "create_settings", fixLabel: "সমাধান করুন" });
    if (c.settings.chat_enabled === false) c.issues.push({ id: "settings:chat_off", area: "চ্যাট", title: "চ্যাট বন্ধ আছে", detail: "ব্যবহারকারীরা উত্তর পাচ্ছেন না", fix: "enable_chat", fixLabel: "সমাধান করুন" });
    c.passed.push("সেটিংস");
  },
  async chat(c) {
    const t = chatTarget(c);
    if (!t.key) return void c.issues.push({ id: "chat:nokey", area: "চ্যাট", title: `${t.provider} কী সেট করা নেই`, detail: "অ্যাডমিন প্যানেলে কী দিন" });
    const r = await chatCall(t.url, t.key, t.model, "Reply with: ok");
    if (r.ok) return void c.passed.push(`চ্যাট (${t.model})`);
    const why = classify(r.status, r.text);
    c.issues.push({
      id: "chat:primary", area: "চ্যাট", title: `মূল এআই উত্তর দিচ্ছে না — ${why}`, detail: `${t.model}: ${r.text.slice(0, 160)}`,
      ...(t.provider === "google" && r.status === 404 ? { fix: "switch_model", fixLabel: "সমাধান করুন" } : {}),
    });
  },
  async vision(c) {
    const t = chatTarget(c);
    if (!t.key) return;
    const r = await chatCall(t.url, t.key, t.model, [{ type: "text", text: "What color? one word" }, { type: "image_url", image_url: { url: TINY_PNG } }]);
    if (r.ok) return void c.passed.push("ছবি বিশ্লেষণ");
    c.issues.push({ id: "vision", area: "ছবি", title: `ছবি বোঝা যাচ্ছে না — ${classify(r.status, r.text)}`, detail: r.text.slice(0, 160), ...(t.provider === "google" && r.status === 404 ? { fix: "switch_model", fixLabel: "সমাধান করুন" } : {}) });
  },
  async pool(c) {
    const pool: any[] = Array.isArray(c.keys?.key_pool) ? c.keys.key_pool : [];
    await Promise.all(pool.map(async (p, i) => {
      if (p?.active === false || !p?.key?.trim()) return;
      const url = p.provider === "custom" ? `${String(p.base_url ?? "").replace(/\/$/, "")}/chat/completions` : p.provider === "openai" ? "https://api.openai.com/v1/chat/completions" : GOOGLE_CHAT;
      const model = p.model?.trim() || (p.provider === "google" ? c.settings?.model || "gemini-3.5-flash" : "gpt-4o");
      const r = await chatCall(url, p.key.trim(), model, "ok");
      if (r.ok) return void c.passed.push(`অতিরিক্ত কী: ${p.name || i + 1}`);
      const temp = r.status === 429 || r.status >= 500;
      c.issues.push({ id: `pool:${i}`, area: "কী-পুল", title: `"${p.name || `কী ${i + 1}`}" কাজ করছে না — ${classify(r.status, r.text)}`, detail: `${model}: ${r.text.slice(0, 140)}`, ...(temp ? {} : { fix: `disable_pool:${i}`, fixLabel: "সমাধান করুন" }) });
    }));
  },
  async drive(c) {
    const m = await import("@/lib/drive-memory.server");
    if (!m.driveConfigured()) return void c.issues.push({ id: "drive:off", area: "গুগল ড্রাইভ", title: "গুগল ড্রাইভ সংযুক্ত নেই", detail: "সংযোগ নেই" });
    const { items } = await m.loadMemory(true);
    await m.saveMemory(items); // real write round-trip
    const back = await m.loadMemory(true);
    if (back.items.length !== items.length) throw new Error("লেখার পর পড়ে মিলছে না");
    c.passed.push(`গুগল ড্রাইভ (পড়া+লেখা, ${items.length}টি স্মৃতি)`);
  },
  async admin(c) {
    const { data } = await c.admin.auth.admin.listUsers({ perPage: 1000 });
    const u = data?.users?.find((x: any) => x.email?.toLowerCase() === FOUNDER);
    if (!u) return void c.issues.push({ id: "admin:nouser", area: "অ্যাডমিন", title: "প্রতিষ্ঠাতার অ্যাকাউন্ট পাওয়া যায়নি", detail: `${FOUNDER} দিয়ে একবার লগইন করুন` });
    const { data: ok } = await c.admin.rpc("has_role", { _user_id: u.id, _role: "admin" });
    if (!ok) c.issues.push({ id: "admin:role", area: "অ্যাডমিন", title: "প্রতিষ্ঠাতা অ্যাডমিন হিসেবে চেনা যাচ্ছে না", detail: FOUNDER, fix: "restore_admin", fixLabel: "সমাধান করুন" });
    else c.passed.push("অ্যাডমিন: মোঃ শামীম আহসান");
  },
  async pages(c) {
    const { data, error } = await c.admin.from("pages").select("id").order("created_at", { ascending: false }).limit(1);
    if (error) throw new Error(error.message);
    c.passed.push(`ওয়েবসাইট বিল্ডার (${data?.length ? "পেজ আছে" : "খালি"})`);
  },
};

async function scan(admin: any) {
  const [{ data: settings }, { data: keys }] = await Promise.all([
    admin.from("ai_settings").select("*").eq("id", 1).maybeSingle(),
    admin.from("ai_keys").select("*").eq("id", 1).maybeSingle(),
  ]);
  const c: Ctx = { admin, settings, keys, issues: [], passed: [] };
  await Promise.all(Object.entries(PROBES).map(async ([name, fn]) => {
    try { await fn(c); } catch (e) {
      c.issues.push({ id: `crash:${name}`, area: name, title: `অপ্রত্যাশিত ত্রুটি (${name})`, detail: e instanceof Error ? e.message : String(e) });
    }
  }));
  return { issues: c.issues, passed: c.passed, at: new Date().toISOString() };
}

async function repair(admin: any, fix: string): Promise<string> {
  if (fix === "enable_chat") { await admin.from("ai_settings").update({ chat_enabled: true }).eq("id", 1); return "চ্যাট চালু করা হয়েছে"; }
  if (fix === "create_settings") { await admin.from("ai_settings").upsert({ id: 1, provider: "google", model: "gemini-3.5-flash", chat_enabled: true }); return "সেটিংস তৈরি হয়েছে"; }
  if (fix === "switch_model") {
    const { data: k } = await admin.from("ai_keys").select("google_key").eq("id", 1).maybeSingle();
    const key = k?.google_key?.trim() || process.env["GOOGLE_API_KEY"];
    for (const m of WORKING_GOOGLE_MODELS) {
      if ((await chatCall(GOOGLE_CHAT, key, m, "ok")).ok) { await admin.from("ai_settings").update({ model: m, provider: "google" }).eq("id", 1); return `মডেল বদলে ${m} করা হয়েছে`; }
    }
    throw new Error("কোনো সচল Google মডেল পাওয়া যায়নি");
  }
  if (fix.startsWith("disable_pool:")) {
    const i = Number(fix.split(":")[1]);
    const { data: k } = await admin.from("ai_keys").select("key_pool").eq("id", 1).maybeSingle();
    const pool = Array.isArray(k?.key_pool) ? [...k.key_pool] : [];
    if (pool[i]) pool[i] = { ...pool[i], active: false };
    await admin.from("ai_keys").update({ key_pool: pool }).eq("id", 1);
    return "নষ্ট কী-টি বন্ধ করা হয়েছে (মুছে ফেলা হয়নি)";
  }
  if (fix === "restore_admin") {
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const u = data?.users?.find((x: any) => x.email?.toLowerCase() === FOUNDER);
    if (!u) throw new Error("অ্যাকাউন্ট নেই");
    await admin.from("user_roles").upsert({ user_id: u.id, role: "admin" }, { onConflict: "user_id,role" });
    return "অ্যাডমিন পরিচয় পুনরুদ্ধার হয়েছে";
  }
  throw new Error("অজানা সমাধান");
}

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });
        const pub = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, { auth: { persistSession: false, autoRefreshToken: false } });
        const { data: u, error: ue } = await pub.auth.getUser(token);
        if (ue || !u.user) return new Response("Unauthorized", { status: 401 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
        if (!isAdmin) return new Response("শুধু অ্যাডমিন", { status: 403 });

        const body = await request.json().catch(() => ({}));
        let repaired: { ok: boolean; message: string } | undefined;
        if (typeof body?.fix === "string") {
          try { repaired = { ok: true, message: await repair(supabaseAdmin, body.fix) }; }
          catch (e) { repaired = { ok: false, message: e instanceof Error ? e.message : String(e) }; }
        }
        const results = { ...(await scan(supabaseAdmin)), repaired };
        await supabaseAdmin.from("health_checks").insert({ results });
        return Response.json(results);
      },
    },
  },
});
