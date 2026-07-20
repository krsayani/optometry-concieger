import { supabase } from "@/integrations/supabase/client";

export async function getPlatformStats() {
  const [
    { count: usersCount, error: usersError },
    { count: odIntakesCount, error: odError },
    { count: practiceIntakesCount, error: practiceError }
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("od_intake_responses").select("*", { count: "exact", head: true }),
    supabase.from("employer_intake_responses").select("*", { count: "exact", head: true }),
  ]);

  if (usersError) throw usersError;
  if (odError) throw odError;
  if (practiceError) throw practiceError;

  return {
    users: usersCount || 0,
    odIntakes: odIntakesCount || 0,
    practiceIntakes: practiceIntakesCount || 0,
  };
}

export async function listODIntakes() {
  const { data, error } = await supabase
    .from("od_intake_responses")
    .select("*, profile:profiles(avatar_url, email_verified)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(item => ({
    ...item,
    avatar_url: item.profile?.avatar_url,
    email_verified: item.profile?.email_verified
  }));
}

export async function listPracticeIntakes() {
  const { data, error } = await supabase
    .from("employer_intake_responses")
    .select("*, profile:profiles(avatar_url, email_verified)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(item => ({
    ...item,
    avatar_url: item.profile?.avatar_url,
    email_verified: item.profile?.email_verified
  }));
}

export async function adminDeleteODIntake(id) {
  const { error } = await supabase.from("od_intake_responses").delete().eq("id", id);
  if (error) throw error;
}

export async function adminDeletePracticeIntake(id) {
  const { error } = await supabase.from("employer_intake_responses").delete().eq("id", id);
  if (error) throw error;
}

export async function adminUpdateODIntake(id, updates) {
  const { data, error } = await supabase
    .from("od_intake_responses")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function adminUpdatePracticeIntake(id, updates) {
  const { data, error } = await supabase
    .from("employer_intake_responses")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listMatches() {
  const { data, error } = await supabase
    .from("concierge_matches")
    .select(`
      *,
      od:od_intake_responses(*, profile:profiles(avatar_url)),
      practice:employer_intake_responses(*, profile:profiles(avatar_url))
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(match => ({
    ...match,
    od: {
        ...match.od,
        avatar_url: match.od?.profile?.avatar_url
    },
    practice: {
        ...match.practice,
        avatar_url: match.practice?.profile?.avatar_url
    }
  }));
}

export async function createMatch(odId, employerId) {
  const { data, error } = await supabase
    .from("concierge_matches")
    .insert({ od_intake_id: odId, employer_intake_id: employerId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMatchStatus(matchId, status) {
  const { data, error } = await supabase
    .from("concierge_matches")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", matchId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMatch(matchId) {
  const { error } = await supabase
    .from("concierge_matches")
    .delete()
    .eq("id", matchId);
  if (error) throw error;
}

export async function listAllUsers() {
  try {
    const [
      { data: profiles, error: profilesError },
      { data: roles, error: rolesError },
      { data: odIntakes, error: odError },
      { data: practiceIntakes, error: practiceError }
    ] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("od_intake_responses").select("id, user_id, email"),
      supabase.from("employer_intake_responses").select("id, user_id, email")
    ]);

    if (profilesError) throw profilesError;
    if (rolesError) throw rolesError;
    if (odError) throw odError;
    if (practiceError) throw practiceError;

    return profiles.map(profile => {
      const userRoles = (roles || []).filter(r => r.user_id === profile.id).map(r => r.role);
      const odIntake = (odIntakes || []).find(i => i.user_id === profile.id);
      const practiceIntake = (practiceIntakes || []).find(i => i.user_id === profile.id);

      return {
        ...profile,
        roles: userRoles,
        role: userRoles.includes("super_admin") ? "super_admin" : (userRoles[0] || "none"),
        od_intake_id: odIntake?.id,
        practice_intake_id: practiceIntake?.id,
        email: odIntake?.email || practiceIntake?.email // Try to get email from intake data
      };
    });
  } catch (err) {
    console.error("listAllUsers failed:", err);
    throw err;
  }
}

// User Actions
export async function updateUserStatus(userId, status) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteUser(userId) {
  // 1. Fetch data for cleanup (URLs) before records are gone
  try {
    const [profileRes, intakeRes] = await Promise.all([
      supabase.from("profiles").select("avatar_url").eq("id", userId).maybeSingle(),
      supabase.from("od_intake_responses").select("resume_url").eq("user_id", userId).maybeSingle(),
    ]);

    const avatarUrl = profileRes.data?.avatar_url;
    const resumeUrl = intakeRes.data?.resume_url;

    // Helper to extract path from Supabase Public URL
    const getPathFromUrl = (url, bucket) => {
      if (!url) return null;
      // Supabase storage URLs usually follow: .../storage/v1/object/public/[bucket]/[path]
      const parts = url.split(`/public/${bucket}/`);
      return parts.length > 1 ? parts[1] : null;
    };

    const avatarPath = getPathFromUrl(avatarUrl, "avatars");
    const resumePath = getPathFromUrl(resumeUrl, "resumes");

    // 2. Storage Cleanup
    const storageDeletions = [];

    // Delete files by specific path extracted from URL
    if (avatarPath) storageDeletions.push(supabase.storage.from("avatars").remove([avatarPath]));
    if (resumePath) storageDeletions.push(supabase.storage.from("resumes").remove([resumePath]));

    // Also try to delete user-ID based folders if they exist
    // This handles cases where multiple files might be associated or newer folder-based structure
    storageDeletions.push(supabase.storage.from("avatars").list(userId).then(({ data }) => {
        if (data?.length) return supabase.storage.from("avatars").remove(data.map(f => `${userId}/${f.name}`));
    }));
    storageDeletions.push(supabase.storage.from("resumes").list(userId).then(({ data }) => {
        if (data?.length) return supabase.storage.from("resumes").remove(data.map(f => `${userId}/${f.name}`));
    }));

    await Promise.allSettled(storageDeletions);

    // 3. Explicitly delete role-specific database data
    // (Though RPC handles auth.users cascade, cleaning these ensures linked matches etc are handled cleanly)
    await Promise.all([
      supabase.from("od_intake_responses").delete().eq("user_id", userId),
      supabase.from("employer_intake_responses").delete().eq("user_id", userId),
    ]);
  } catch (err) {
    console.error("Pre-deletion cleanup failed:", err);
  }

  // 4. Call the database RPC to delete the user from auth.users
  // This will cascade to profiles, user_roles, and intake tables.
  const { error: rpcError } = await supabase.rpc("delete_user", {
    target_user_id: userId
  });

  if (rpcError) {
    console.error("Error deleting user via RPC:", rpcError);
    throw new Error(`Failed to delete user account: ${rpcError.message}`);
  }
}

export async function addUserRole(userId, role) {
  // If making someone a super_admin, remove all other roles and professional data first
  if (role === 'super_admin') {
    await Promise.all([
        supabase.from("user_roles").delete().eq("user_id", userId),
        supabase.from("od_intake_responses").delete().eq("user_id", userId),
        supabase.from("employer_intake_responses").delete().eq("user_id", userId),
    ]);
  } else {
    // If giving someone a regular role (OD or Employer), remove super_admin if they have it
    // Super Admin must be standalone for security/workflow reasons
    await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "super_admin");
  }

  const { data, error } = await supabase
    .from("user_roles")
    .insert({ user_id: userId, role })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return { message: "User already has this role" };
    throw error;
  }
  return data;
}

export async function removeUserRole(userId, role) {
  const { error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role);

  if (error) throw error;
}

export async function updateUserRole(userId, newRole) {
  // Legacy support for single-role updates if needed,
  // but now we'll just use it to ADD a role via the existing UI buttons
  return addUserRole(userId, newRole);
}

// Notifications
export async function getAdminNotifications() {
  const { data, error } = await supabase
    .from("admin_notifications")
    .select(`
      *,
      user:profiles(full_name, avatar_url)
    `)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return data;
}

export async function markNotificationRead(id) {
  const { error } = await supabase
    .from("admin_notifications")
    .update({ is_read: true })
    .eq("id", id);
  if (error) throw error;
}

export async function clearAllNotifications() {
  const { error } = await supabase
    .from("admin_notifications")
    .delete()
    .gte("id", "00000000-0000-0000-0000-000000000000"); // Standard way to delete all in Supabase
  if (error) throw error;
}
