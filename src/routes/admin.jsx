import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw redirect({ to: "/auth", search: { mode: "login" } });
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    const isSuperAdmin = roles?.some(r => r.role === "super_admin");

    if (!isSuperAdmin) {
      throw redirect({ to: "/" });
    }

    return { user: session.user, role: "super_admin" };
  },
  component: () => <Outlet />,
});
