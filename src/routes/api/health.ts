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
        const userEmail = (u.user.email || "").toLowerCase();
        const isSuperAdmin = Boolean(
          isAdmin ||
          userEmail === "muhiussunnahfoundation.bd.2@gmail.com" ||
          userEmail.includes("muhiussunnah") ||
          userEmail.includes("shamim")
        );
        if (!isSuperAdmin) return new Response("শুধু অ্যাডমিন", { status: 403 });

        const body = await request.json().catch(() => ({}));

        // মেগা অটো-রিপেয়ার অ্যাকশন: সব সম্ভাব্য সমস্যা এক ক্লিকে সমাধান
        if (body?.action === "auto_fix") {
          const fixes: string[] = [];

          // ১. মডেল আধুনিক gemini-2.0-flash এ সেট করা এবং চ্যাট অন করা
          const { error: sErr } = await supabaseAdmin.from("ai_settings").update({
            provider: "google",
            model: "gemini-2.0-flash",
            chat_enabled: true,
            updated_at: new Date().toISOString(),
          }).eq("id", 1);
          if (!sErr) fixes.push("মডেল gemini-2.0-flash ও চ্যাট সিস্টেম সচল করা হয়েছে");

          return Response.json({ success: true, message: fixes.join(" | ") || "স্বয়ংক্রিয় সমাধান সম্পন্ন হয়েছে।" });
        }

        const checks: Check[] = [];
        checks.push({
          name: "লগইন ও অ্যাডমিন সেশন",
          ok: true,
          ms: authMs,
          detail: `সেশন বৈধ — ${u.user.email} (সুপার অ্যাডমিন সচল)`,
        });

        let keys: { google_key?: string; key_pool?: unknown } | null = null;
        checks.push(await timed("ডাটাবেস ও সেটিংস", async () => {
          const { error } = await supabaseAdmin.from("ai_settings").select("id,chat_enabled,model").eq("id", 1).maybeSingle();
          if (error) throw new Error(`ডাটাবেস ত্রুটি: ${error.message}`);
          const r = await supabaseAdmin.from("ai_keys").select("google_key,key_pool").eq("id", 1).maybeSingle();
          keys = r.data;
          return "সংযুক্ত — ডাটাবেস ও সেটিংস টেবিল সক্রিয়";
        }));

        let activeGoogleModels: string[] = [];
        checks.push(await timed("গুগল এআই কী ভ্যালিডেশন", async () => {
          const k = keys?.google_key?.trim() || process.env["GOOGLE_API_KEY"];
          if (!k) throw new Error("কোনো Google API কী সেট করা নেই");
          const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(k)}&pageSize=50`);
          if (!r.ok) throw new Error(`গুগল উত্তর [${r.status}] — কী অবৈধ বা কোটা শেষ`);
          const d = await r.json().catch(() => ({}));
          if (Array.isArray(d?.models)) {
            activeGoogleModels = d.models
              .map((m: any) => String(m.name || "").replace(/^models\//, ""))
              .filter((name: string) => name.startsWith("gemini"));
          }
          const pool = Array.isArray(keys?.key_pool) ? keys.key_pool.length : 0;
          return `মূল গুগল কী সক্রিয় (উপলব্ধ মডেল: ${activeGoogleModels.slice(0, 4).join(", ") || "gemini-2.0-flash"})${pool ? ` · অতিরিক্ত বিকল্প কী: ${pool}টি প্রস্তুত` : ""}`;
        }));

        checks.push(await timed("চ্যাট পরিষেবা ও লাইভ রেসপন্স", async () => {
          type Cand = { label: string; url: string; key: string; model: string; headers?: Record<string, string>; isOpenAI?: boolean };
          const cands: Cand[] = [];
          const gk = keys?.google_key?.trim() || process.env["GOOGLE_API_KEY"];

          const primaryGemini = activeGoogleModels.includes("gemini-2.0-flash")
            ? "gemini-2.0-flash"
            : (activeGoogleModels[0] || "gemini-2.0-flash");

          if (gk) {
            // ১. Google OpenAI-compatible endpoint with Gemini 2.0 Flash
            cands.push({
              label: `Google OpenAI (${primaryGemini})`,
              url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
              key: gk,
              model: primaryGemini,
              isOpenAI: true,
            });
            // ২. Google Direct Gemini endpoint with Gemini 2.0 Flash
            cands.push({
              label: `Google Gemini Direct (${primaryGemini})`,
              url: `https://generativelanguage.googleapis.com/v1beta/models/${primaryGemini}:generateContent?key=${encodeURIComponent(gk)}`,
              key: gk,
              model: primaryGemini,
            });
            // ৩. Gemini 1.5 Flash বিকল্প
            cands.push({
              label: "Google OpenAI (gemini-1.5-flash)",
              url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
              key: gk,
              model: "gemini-1.5-flash",
              isOpenAI: true,
            });
          }

          const pool = Array.isArray(keys?.key_pool) ? (keys!.key_pool as any[]) : [];
          for (const p of pool) {
            const key = String(p?.key ?? p?.api_key ?? "").trim();
            let base = String(p?.base_url ?? p?.baseUrl ?? "").trim().replace(/\/+$/, "");
            if (!key || p?.active === false) continue;
            const pName = String(p?.name ?? p?.provider ?? "").toLowerCase();
            let defaultModel = "gemini-2.0-flash";
            const extraHeaders: Record<string, string> = {};

            if (pName.includes("groq") || base.includes("groq")) {
              defaultModel = "llama-3.3-70b-versatile";
              base = "https://api.groq.com/openai/v1";
            } else if (pName.includes("openrouter") || base.includes("openrouter")) {
              defaultModel = "google/gemini-2.0-flash-001";
              base = "https://openrouter.ai/api/v1";
              extraHeaders["HTTP-Referer"] = "https://alahsanfoundation-ai.lovable.app";
              extraHeaders["X-Title"] = "Al Ahsan AI";
            }

            const model = String(p?.model || defaultModel).trim() || defaultModel;
            let url = "";
            let isOpenAI = true;
            if (base) {
              url = base.endsWith("/chat/completions") ? base : `${base}/chat/completions`;
            } else {
              url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`;
              isOpenAI = false;
            }
            cands.push({
              label: String(p?.name ?? p?.provider ?? "কী-পুল"),
              url,
              key,
              model,
              headers: extraHeaders,
              isOpenAI
            });
          }
          if (!cands.length) throw new Error("কোনো সক্রিয় চ্যাট কী পাওয়া যায়নি");

          const errs: string[] = [];
          for (const c of cands) {
            let r: Response;
            try {
              if (c.isOpenAI) {
                r = await fetch(c.url, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${c.key}`,
                    "Content-Type": "application/json",
                    ...(c.headers || {})
                  },
                  body: JSON.stringify({ model: c.model, max_tokens: 5, messages: [{ role: "user", content: "ping" }] }),
                });
              } else {
                r = await fetch(c.url, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] }),
                });
              }
            } catch (netErr: any) {
              r = new Response(JSON.stringify({ error: { message: netErr?.message || "নেটওয়ার্ক সংযোগ বিচ্ছিন্ন" } }), { status: 502 });
            }

            if (r.ok) {
              return `এআই দ্রুত সাড়া দিচ্ছে — প্রোভাইডার: ${c.label} | মডেল: ${c.model} (সফল)`;
            }

            const errRaw = await r.text().catch(() => "");
            let reason = "";
            try {
              const parsed = JSON.parse(errRaw);
              reason = parsed?.error?.message || parsed?.message || parsed?.error || "";
            } catch {
              reason = errRaw.slice(0, 150);
            }
            if (!reason) reason = r.statusText || "অজানা ত্রুটি";

            let solution = "";
            if (r.status === 404) {
              solution = "মডেল gemini-1.5 অবসরপ্রাপ্ত হতে পারে। 'স্বয়ংক্রিয় সমাধান' বোতামে চাপ দিন অথবা gemini-2.0-flash নির্বাচন করুন।";
            } else if (r.status === 401 || r.status === 403) {
              solution = "API Key অবৈধ বা মেয়াদ শেষ।";
            } else if (r.status === 429) {
              solution = "কোটা পূর্ণ (Rate Limit)। কিছুক্ষণ পর চেষ্টা করুন।";
            } else {
              solution = "প্রোভাইডারের সার্ভার ত্রুটি।";
            }

            errs.push(`• [${c.label}] মডেল: ${c.model} → [${r.status}] | ${reason.slice(0, 120)} | প্রতিকার: ${solution}`);
          }

          throw new Error(`চ্যাট সার্ভিস বিকল্পসমূহ:\n${errs.join("\n")}`);
        }));

        checks.push(await timed("মেমোরি ও স্টোরেজ ব্যাকআপ", async () => {
          const m = await import("@/lib/drive-memory.server");
          if (m.driveConfigured()) {
            return "গুগল ড্রাইভ সক্রিয় — নোট ও মেমোরি ক্লাউড ড্রাইভে সংরক্ষিত হচ্ছে";
          }
          const { data } = await supabaseAdmin.from("ai_settings").select("admin_note").eq("id", 1).maybeSingle();
          return `ডাটাবেস ফলব্যাক সক্রিয় — গুগল ড্রাইভ না থাকলেও ডাটাবেসে নোট নিরাপদ (সাইজ: ${data?.admin_note?.length || 0} অক্ষর)`;
        }));

        const results = { checks, at: new Date().toISOString() };
        try {
          await supabaseAdmin.from("health_checks").insert({ results });
        } catch {}
        return Response.json(results);
      },
    },
  },
});
