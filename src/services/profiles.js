import { supabase } from "@/integrations/supabase/client";

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, values) {
  const { data, error } = await supabase
    .from("profiles")
    .update(values)
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function uploadAvatar(userId, file) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/avatar-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, cacheControl: "3600" });
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from("avatars")
    .getPublicUrl(path);

  return publicUrl;
}

export async function uploadResume(userId, file) {
  const ext = file.name.split(".").pop() || "pdf";
  const path = `${userId}/resume-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(path, file, { upsert: true, cacheControl: "3600" });
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from("resumes")
    .getPublicUrl(path);

  return publicUrl;
}

export async function checkEmailAvailability(email) {
  if (!email) return true;

  // Query Supabase Auth directly via RPC to see if the user is already registered
  const { data: exists, error } = await supabase.rpc("check_auth_user_exists", {
    email_input: email
  });

  if (error) {
    console.error("Error checking email availability:", error);
    return true; // Default to available on error to not block user
  }

  return !exists;
}

export async function getODIntake(userId) {
  const { data, error } = await supabase
    .from("od_intake_responses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data?.[0] || null;
}

export async function listODIntakesByUser(userId) {
  const { data, error } = await supabase
    .from("od_intake_responses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getPracticeIntake(userId) {
  const { data, error } = await supabase
    .from("employer_intake_responses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data?.[0] || null;
}

export async function listPracticeIntakesByUser(userId) {
  const { data, error } = await supabase
    .from("employer_intake_responses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateODIntake(intakeId, updates, userId) {
  if (intakeId) {
    const { data, error } = await supabase
        .from("od_intake_responses")
        .update(updates)
        .eq("id", intakeId)
        .select()
        .single();
    if (error) throw error;
    return data;
  }

  // Create new if no ID provided
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();
  const firstName = profile?.full_name?.split(" ")[0] || "";
  const lastName = profile?.full_name?.split(" ").slice(1).join(" ") || "";

  const { data, error } = await supabase
    .from("od_intake_responses")
    .insert({
      user_id: userId,
      first_name: updates.first_name || firstName,
      last_name: updates.last_name || lastName,
      email: updates.email || "",
      phone: updates.phone || "N/A",
      school: updates.school || "Other",
      grad_year: updates.grad_year || new Date().getFullYear().toString(),
      license_status: updates.license_status || "Licensed (1 state)",
      license_states: updates.license_states || "",
      years_in_practice: updates.years_in_practice || "1-3 years",
      completed_residency: updates.completed_residency || "No",
      preferred_states: updates.preferred_states || ["Open to Anywhere"],
      open_to_relocation: updates.open_to_relocation || "Maybe",
      practice_setting: updates.practice_setting || ["Private Practice"],
      practice_type_preference: updates.practice_type_preference || "Open to either",
      clinical_interests: updates.clinical_interests || ["Comprehensive"],
      salary_expectation: updates.salary_expectation || "$120k - $140k",
      target_start_date: updates.target_start_date || "As soon as possible",
      job_priorities: updates.job_priorities || ["Work-Life Balance"],
      interest_in_ownership: updates.interest_in_ownership || "Open to it",
      position_type: updates.position_type || "Full-Time",
      consent: true,
      ...updates
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePracticeIntake(intakeId, updates, userId) {
  if (intakeId) {
    const { data, error } = await supabase
        .from("employer_intake_responses")
        .update(updates)
        .eq("id", intakeId)
        .select()
        .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("employer_intake_responses")
    .insert({
      user_id: userId,
      contact_name: updates.contact_name || "Practice Contact",
      practice_name: updates.practice_name || "My Practice",
      email: updates.email || "",
      phone: updates.phone || "N/A",
      location: updates.location || "N/A",
      practice_type: updates.practice_type || "Independent Private Practice",
      num_ods: updates.num_ods || "0-1",
      position_type: updates.position_type || "Full-Time",
      salary_range: updates.salary_range || "$120k - $140k",
      production_bonus: updates.production_bonus || "No",
      relocation_assistance: updates.relocation_assistance || "No",
      benefits: updates.benefits || [],
      schedule: updates.schedule || "Mon-Fri",
      patient_volume: updates.patient_volume || "2/hour",
      primary_care_type: updates.primary_care_type || ["Routine/Comprehensive"],
      new_grad_friendly: updates.new_grad_friendly || "Open to Both",
      mentorship_available: updates.mentorship_available || "Yes",
      ownership_track: updates.ownership_track || "Future possibility",
      urgency: updates.urgency || "Within 3 months",
      consent: true,
      ...updates
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteODIntake(intakeId) {
  // 1. Get user_id and resume_url before deleting
  const { data: intake, error: fetchError } = await supabase
    .from("od_intake_responses")
    .select("user_id, resume_url")
    .eq("id", intakeId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!intake) return;

  // 2. Cleanup Storage (Resumes)
  // We try to delete all files in the user's resume folder to ensure complete cleanup
  if (intake.user_id) {
    try {
        const { data: files } = await supabase.storage.from("resumes").list(intake.user_id);
        if (files && files.length > 0) {
            const filesToRemove = files.map(f => `${intake.user_id}/${f.name}`);
            await supabase.storage.from("resumes").remove(filesToRemove);
        }
    } catch (err) {
        console.error("Failed to cleanup resumes from storage:", err);
    }
  }

  // 3. Perform the database deletion
  const { error: deleteError } = await supabase
    .from("od_intake_responses")
    .delete()
    .eq("id", intakeId);

  if (deleteError) throw deleteError;

  // 4. Check if we need to remove the 'od' role (if no more profiles remain)
  if (intake.user_id) {
    const [
        { count: intakeCount, error: countError },
        { count: roleCount, error: roleError }
    ] = await Promise.all([
        supabase.from("od_intake_responses").select("*", { count: 'exact', head: true }).eq("user_id", intake.user_id),
        supabase.from("user_roles").select("*", { count: 'exact', head: true }).eq("user_id", intake.user_id)
    ]);

    if (countError || roleError) {
        console.error("Error checking role removal conditions:", countError || roleError);
        return;
    }

    // Only remove the role if they have NO more profiles AND they have other roles (Dual Role Mode)
    // If they only have this one role, we keep it so they stay in professional mode.
    if (intakeCount === 0 && roleCount > 1) {
        await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", intake.user_id)
            .eq("role", "od");
    }
  }
}

export async function deletePracticeIntake(intakeId) {
  // 1. Get user_id before deleting
  const { data: intake, error: fetchError } = await supabase
    .from("employer_intake_responses")
    .select("user_id")
    .eq("id", intakeId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!intake) return;

  // 2. Perform the deletion
  const { error: deleteError } = await supabase
    .from("employer_intake_responses")
    .delete()
    .eq("id", intakeId);

  if (deleteError) throw deleteError;

  // 3. Check if we need to remove the 'employer' role
  if (intake.user_id) {
    const [
        { count: intakeCount, error: countError },
        { count: roleCount, error: roleError }
    ] = await Promise.all([
        supabase.from("employer_intake_responses").select("*", { count: 'exact', head: true }).eq("user_id", intake.user_id),
        supabase.from("user_roles").select("*", { count: 'exact', head: true }).eq("user_id", intake.user_id)
    ]);

    if (countError || roleError) {
        console.error("Error checking role removal conditions:", countError || roleError);
        return;
    }

    // Only remove the role if they have NO more profiles AND they have other roles (Dual Role Mode)
    if (intakeCount === 0 && roleCount > 1) {
        await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", intake.user_id)
            .eq("role", "employer");
    }
  }
}
