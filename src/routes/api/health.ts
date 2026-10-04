import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

type Check = { name: string; ok: boolean; ms: number; detail: string };

async function timed(name: string, fn: () => Promise<string>): Promise<Check> {
  const t = Date.now();
  try {
    const detail = await fn();
    return { name, ok: true, ms: Date.now() - t, detail };
  } catch (e) {
    return { name, ok: false, ms: Date.now() - t, detail: e instanceof Error ? e.message : String(e) };
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
          const k = process.env["LOVABLE_API_KEY"];
          if (!k) throw new Error("বিল্ট-ইন এআই কী নেই");
          const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "openai/gpt-6-astra", messages: [{ role: "user", content: "Reply with: ok" }] }),
          });
          if (!r.ok) throw new Error(`এআই উত্তর [${r.status}]`);
          await r.text();
          return "এআই উত্তর দিচ্ছে";
        }));

        const results = { checks, at: new Date().toISOString() };
        await supabaseAdmin.from("health_checks").insert({ results });
        return Response.json(results);
      },
    },
  },
});
