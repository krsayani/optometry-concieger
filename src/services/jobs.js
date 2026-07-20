import { supabase } from "@/integrations/supabase/client";

export async function listJobs(filters = {}) {
  let query = supabase
    .from("jobs")
    .select("*, client:profiles!jobs_client_id_fkey(*)")
    .order("created_at", { ascending: false });

  if (filters.category && filters.category !== "All") {
    query = query.eq("category", filters.category);
  }
  if (filters.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(
      `title.ilike.${term},description.ilike.${term},location.ilike.${term}`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getJob(id) {
  const { data, error } = await supabase
    .from("jobs")
    .select("*, client:profiles!jobs_client_id_fkey(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listClientJobs(clientId) {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createJob(clientId, input) {
  const { data, error } = await supabase
    .from("jobs")
    .insert({ ...input, client_id: clientId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateJob(id, input) {
  const { data, error } = await supabase
    .from("jobs")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteJob(id) {
  const { error } = await supabase.from("jobs").delete().eq("id", id);
  if (error) throw error;
}
