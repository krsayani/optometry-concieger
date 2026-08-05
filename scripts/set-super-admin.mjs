/**
 * One-time / ops script: set the super-admin auth email + password via Supabase Admin API.
 *
 * Requires (never commit these):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ADMIN_EMAIL
 *   ADMIN_PASSWORD
 *   ADMIN_USER_ID   (optional — defaults to known abubakar admin id)
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   ADMIN_EMAIL='Admin@optometryconcierge.com' ADMIN_PASSWORD='...' \
 *   node scripts/set-super-admin.mjs
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL || "Admin@optometryconcierge.com";
const adminPassword = process.env.ADMIN_PASSWORD;
const adminUserId =
  process.env.ADMIN_USER_ID || "96bdef8b-4ebc-411c-88fe-81bc87fffe8f";

if (!url || !serviceRoleKey || !adminPassword) {
  console.error(
    "Missing SUPABASE_URL / VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or ADMIN_PASSWORD.",
  );
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: updated, error: updateError } =
  await admin.auth.admin.updateUserById(adminUserId, {
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { full_name: "Admin" },
  });

if (updateError) {
  console.error("Failed to update auth user:", updateError.message);
  process.exit(1);
}

const { error: profileError } = await admin
  .from("profiles")
  .update({
    full_name: "Admin",
    email_verified: true,
    updated_at: new Date().toISOString(),
  })
  .eq("id", adminUserId);

if (profileError) {
  console.error("Auth updated, but profile update failed:", profileError.message);
  process.exit(1);
}

const { data: existingRole } = await admin
  .from("user_roles")
  .select("id")
  .eq("user_id", adminUserId)
  .eq("role", "super_admin")
  .maybeSingle();

if (!existingRole) {
  const { error: roleError } = await admin.from("user_roles").insert({
    user_id: adminUserId,
    role: "super_admin",
  });
  if (roleError) {
    console.error("Auth updated, but role insert failed:", roleError.message);
    process.exit(1);
  }
}

console.log("Super admin updated:");
console.log("  id:", updated.user.id);
console.log("  email:", updated.user.email);
console.log("  email confirmed: yes");
console.log("  role: super_admin");
