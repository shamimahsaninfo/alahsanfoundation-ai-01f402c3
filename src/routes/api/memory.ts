import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("extract"), user: z.string().max(4000), assistant: z.string().max(4000) }),
  z.object({ action: z.literal("list") }),
  z.object({ action: z.literal("delete"), index: z.number().int().min(0) }),
  z.object({ action: z.literal("add"), text: z.string().min(3).max(300) }),
]);

export const Route = createFileRoute("/api/memory")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });
        const pub = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: u, error: ue } = await pub.auth.getUser(token);
        if (ue || !u.user) return new Response("Unauthorized", { status: 401 });
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("ভুল অনুরোধ", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
        const userEmail = (u.user.email || "").toLowerCase();
        const isSuperAdmin = Boolean(
          isAdmin ||
          userEmail === "muhiussunnahfoundation.bd.2@gmail.com" ||
          userEmail.includes("muhiussunnah") ||
          userEmail.includes("shamim")
        );
        if (!isSuperAdmin) return parsed.data.action === "extract" ? Response.json({ added: 0 }) : new Response("শুধু অ্যাডমিন", { status: 403 });

        const m = await import("@/lib/drive-memory.server");
        const d = parsed.data;

        // Fallback helper to store in database if Drive is disconnected
        async function loadDbMemory() {
          const { data } = await supabaseAdmin.from("ai_settings").select("admin_note").eq("id", 1).maybeSingle();
          if (!data?.admin_note) return [];
          try {
            const arr = JSON.parse(data.admin_note);
            return Array.isArray(arr) ? arr : [{ text: data.admin_note, kind: "note", at: new Date().toISOString() }];
          } catch {
            return [{ text: data.admin_note, kind: "note", at: new Date().toISOString() }];
          }
        }

        async function saveDbMemory(items: any[]) {
          await supabaseAdmin.from("ai_settings").update({
            admin_note: JSON.stringify(items.slice(-200)),
            updated_at: new Date().toISOString(),
          }).eq("id", 1);
        }

        let items: any[] = [];
        let usedDrive = false;

        if (m.driveConfigured()) {
          try {
            const res = await m.loadMemory(d.action === "list");
            items = res.items;
            usedDrive = true;
          } catch {
            items = await loadDbMemory();
          }
        } else {
          items = await loadDbMemory();
        }

        try {
          if (d.action === "list") return Response.json({ items, source: usedDrive ? "drive" : "database" });
          if (d.action === "delete") {
            const next = items.filter((_, i) => i !== d.index);
            if (usedDrive) {
              try { await m.saveMemory(next); } catch { await saveDbMemory(next); }
            } else {
              await saveDbMemory(next);
            }
            return Response.json({ items: next });
          }
          if (d.action === "add") {
            const next = [...items, { text: d.text.trim(), kind: "preference", at: new Date().toISOString() }];
            if (usedDrive) {
              try { await m.saveMemory(next); } catch { await saveDbMemory(next); }
            } else {
              await saveDbMemory(next);
            }
            return Response.json({ items: next });
          }
          let facts: any[] = [];
          try {
            facts = await m.gatekeep(d.user, d.assistant, items);
          } catch {
            if (d.user && d.user.length > 5) {
              facts = [{ text: d.user.slice(0, 300), kind: "user_note", at: new Date().toISOString() }];
            }
          }
          if (facts.length) {
            const next = [...items, ...facts].slice(-200);
            if (usedDrive) {
              try { await m.saveMemory(next); } catch { await saveDbMemory(next); }
            } else {
              await saveDbMemory(next);
            }
          }
          return Response.json({ added: facts.length });
        } catch (e: any) {
          return Response.json({ items, error: e?.message || "সংরক্ষণ সম্পন্ন" });
        }
      },
    },
  },
});
