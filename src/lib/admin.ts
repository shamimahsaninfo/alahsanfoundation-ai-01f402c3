import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Admin status comes from the server-side role list; the founder account is auto-granted on the server. */
export function useIsAdmin(userId?: string) {
  const [admin, setAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    (async () => {
      const { data: has } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
      if (has) return alive && setAdmin(true);
      const { data: claimed } = await supabase.rpc("claim_founder_admin");
      if (alive) setAdmin(!!claimed);
    })().catch(() => alive && setAdmin(false));
    return () => {
      alive = false;
    };
  }, [userId]);
  return admin;
}
