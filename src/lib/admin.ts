import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Admin status comes from the server-side role list; the founder account is auto-granted on the server. */
export function useIsAdmin(userId?: string) {
  const [admin, setAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    if (!userId) return;
    supabase.rpc("claim_founder_admin").then(({ data, error }) => {
      if (!error) return setAdmin(!!data);
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }).then(({ data: d }) => setAdmin(!!d));
    });
  }, [userId]);
  return admin;
}
