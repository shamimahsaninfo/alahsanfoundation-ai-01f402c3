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
        // Only the admin's statements can shape the shared memory.
        if (!isAdmin) return parsed.data.action === "extract" ? Response.json({ added: 0 }) : new Response("শুধু অ্যাডমিন", { status: 403 });

        const m = await import("@/lib/drive-memory.server");
        if (!m.driveConfigured()) return new Response("গুগল ড্রাইভ সংযুক্ত নেই", { status: 503 });
        try {
          const d = parsed.data;
          const { items } = await m.loadMemory(d.action === "list");
          if (d.action === "list") return Response.json({ items });
          if (d.action === "delete") {
            const next = items.filter((_, i) => i !== d.index);
            await m.saveMemory(next);
            return Response.json({ items: next });
          }
          if (d.action === "add") {
            const next = [...items, { text: d.text.trim(), kind: "preference", at: new Date().toISOString() }];
            await m.saveMemory(next);
            return Response.json({ items: next });
          }
          const facts = await m.gatekeep(d.user, d.assistant, items);
          if (facts.length) await m.saveMemory([...items, ...facts].slice(-200));
          return Response.json({ added: facts.length });
        } catch (e: any) {
          return new Response(e?.message || "ড্রাইভ ত্রুটি", { status: 502 });
        }
      },
    },
  },
});
