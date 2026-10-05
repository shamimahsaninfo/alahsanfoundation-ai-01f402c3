import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

type Check = { name: string; ok: boolean; ms: number; detail: string; fixable?: boolean };

async function timed(name: string, fn: () => Promise<string>): Promise<Check> {
  const t = Date.now();
  try {
    const detail = await fn();
    return { name, ok: true, ms: Date.now() - t, detail };
  } catch (e) {
    return { name, ok: false, ms: Date.now() - t, detail: e instanceof Error ? e.message : String(e), fixable: true };
  }
}

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });
        const pub = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const t0 = Date.now();
        const { data: u, error: ue } = await pub.auth.getUser(token);
        if (ue || !u.user) return new Response("Unauthorized", { status: 401 });
        const authMs = Date.now() - t0;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
        if (!isAdmin) return new Response("শুধু অ্যাডমিন", { status: 403 });

        const body = await request.json().catch(() => ({}));
        if (body?.action === "auto_fix") {
          await supabaseAdmin.from("ai_settings").update({
            provider: "google",
            model: "gemini-1.5-flash",
            updated_at: new Date().toISOString(),
          }).eq("id", 1);
          return Response.json({ success: true, message: "মডেল gemini-1.5-flash এ রিসেট করা হয়েছে।" });
        }

        const checks: Check[] = [];
        checks.push({ name: "লগইন", ok: true, ms: authMs, detail: `সেশন বৈধ — ${u.user.email} (অ্যাডমিন)` });

        let keys: { google_key?: string; key_pool?: unknown } | null = null;
        checks.push(await timed("ডাটাবেস", async () => {
          const { error } = await supabaseAdmin.from("ai_settings").select("id").eq("id", 1).maybeSingle();
          if (error) throw new Error(error.message);
          const r = await supabaseAdmin.from("ai_keys").select("google_key,key_pool").eq("id", 1).maybeSingle();
          keys = r.data;
          return "সংযুক্ত — সেটিংস পড়া গেছে";
        }));

        checks.push(await timed("Google API", async () => {
          const k = keys?.google_key?.trim() || process.env["GOOGLE_API_KEY"];
          if (!k) throw new Error("কোনো Google কী সেট করা নেই");
          const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(k)}&pageSize=1`);
          if (!r.ok) throw new Error(`গুগল উত্তর [${r.status}] — কী অবৈধ বা কোটা শেষ`);
          const pool = Array.isArray(keys?.key_pool) ? keys.key_pool.length : 0;
          return `কী বৈধ${pool ? ` · অতিরিক্ত কী: ${pool}টি` : ""}`;
        }));

        checks.push(await timed("চ্যাট পরিষেবা", async () => {
          type Cand = { label: string; url: string; key: string; model: string };
          const cands: Cand[] = [];
          const gk = keys?.google_key?.trim() || process.env["GOOGLE_API_KEY"];
          if (gk) {
            cands.push({
              label: "Google (gemini-1.5-flash)",
              url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(gk)}`,
              key: gk,
              model: "gemini-1.5-flash",
            });
          }
          const pool = Array.isArray(keys?.key_pool) ? (keys!.key_pool as any[]) : [];
          for (const p of pool) {
            const key = String(p?.key ?? p?.api_key ?? "").trim();
            const base = String(p?.base_url ?? p?.baseUrl ?? "").trim().replace(/\/$/, "");
            if (!key || p?.active === false) continue;
            const url = base ? `${base}/chat/completions` : `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(key)}`;
            cands.push({ label: String(p?.name ?? p?.provider ?? "কী-পুল"), url, key, model: String(p?.model || "gemini-1.5-flash") });
          }
          if (!cands.length) throw new Error("কোনো সক্রিয় চ্যাট কী নেই");
          const errs: string[] = [];
          for (const c of cands) {
            let r: Response;
            if (c.url.includes("generativelanguage.googleapis.com/v1beta/models/")) {
              r = await fetch(c.url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] }),
              }).catch((e) => new Response(String(e), { status: 502 }));
            } else {
              r = await fetch(c.url, {
                method: "POST",
                headers: { Authorization: `Bearer ${c.key}`, "Content-Type": "application/json" },
                body: JSON.stringify({ model: c.model, max_tokens: 5, messages: [{ role: "user", content: "ping" }] }),
              }).catch((e) => new Response(String(e), { status: 502 }));
            }
            if (r.ok) return `এআই উত্তর দিচ্ছে — ${c.label}${errs.length ? ` (বিকল্প কী ব্যবহৃত)` : ""}`;
            errs.push(`${c.label} [${r.status}]`);
          }
          throw new Error(`সব কী ব্যর্থ: ${errs.join(", ")}`);
        }));

        const results = { checks, at: new Date().toISOString() };
        await supabaseAdmin.from("health_checks").insert({ results }).catch(() => {});
        return Response.json(results);
      },
    },
  },
});
