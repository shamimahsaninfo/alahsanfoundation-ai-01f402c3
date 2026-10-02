import { createFileRoute } from "@tanstack/react-router";

// Short live links for AI-built websites: /project1, /project2, ...
export const Route = createFileRoute("/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const m = /^project(\d{1,12})$/i.exec(params.slug);
        if (!m) return new Response("পেজটি পাওয়া যায়নি", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin.from("pages").select("html").eq("num", Number(m[1])).maybeSingle();
        if (!data) return new Response("পেজটি পাওয়া যায়নি", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
        return new Response(data.html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=300",
            "Content-Security-Policy": "sandbox allow-scripts allow-forms allow-popups allow-modals",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
