import { createClient } from "@supabase/supabase-js";

export function getServiceRoleClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function getUserScopedClient(accessToken) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key || !accessToken) return null;

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export async function assertSuperAdmin(accessToken) {
  const client = getUserScopedClient(accessToken);
  if (!client) {
    return { ok: false, status: 503, error: "Auth is not configured." };
  }

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser(accessToken);

  if (userError || !user) {
    return { ok: false, status: 401, error: "You must be signed in." };
  }

  const { data: roles, error: rolesError } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (rolesError) {
    return { ok: false, status: 500, error: "Could not verify admin role." };
  }

  const isSuperAdmin = (roles || []).some((r) => r.role === "super_admin");
  if (!isSuperAdmin) {
    return { ok: false, status: 403, error: "Super admin access required." };
  }

  return { ok: true, user, client };
}
