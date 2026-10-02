import { createFileRoute } from "@tanstack/react-router";

// Safe, user-visible settings only (no prompts, no keys).
export const Route = createFileRoute("/api/settings")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin
          .from("ai_settings")
          .select("welcome_title,welcome_subtitle,suggestions,chat_enabled,site_builder")
          .eq("id", 1)
          .maybeSingle();
        return Response.json(data ?? {}, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
