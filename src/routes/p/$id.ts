import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/p/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!/^[0-9a-f-]{36}$/i.test(params.id)) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin.from("pages").select("html").eq("id", params.id).maybeSingle();
        if (!data) return new Response("Not found", { status: 404 });
        return new Response(data.html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=300",
            // Isolate user-generated pages so their scripts cannot read site logins.
            "Content-Security-Policy": "sandbox allow-scripts allow-forms allow-popups allow-modals",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
