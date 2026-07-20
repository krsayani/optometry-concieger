import { supabase } from "@/integrations/supabase/client";

export async function applyToJob(jobId, providerId) {
  const { data, error } = await supabase
    .from("applications")
    .insert({ job_id: jobId, provider_id: providerId, status: "Pending" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function getMyApplicationForJob(jobId, providerId) {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("job_id", jobId)
    .eq("provider_id", providerId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listProviderApplications(providerId) {
  const { data, error } = await supabase
    .from("applications")
    .select("*, job:jobs(*)")
    .eq("provider_id", providerId)
    .order("applied_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listJobApplications(jobId) {
  const { data, error } = await supabase
    .from("applications")
    .select("*, provider:profiles!applications_provider_id_fkey(*)")
    .eq("job_id", jobId)
    .order("applied_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listClientApplications(jobIds) {
  if (jobIds.length === 0) return [];
  const { data, error } = await supabase
    .from("applications")
    .select("*, provider:profiles!applications_provider_id_fkey(*)")
    .in("job_id", jobIds)
    .order("applied_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateApplicationStatus(id, status) {
  const { data, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
