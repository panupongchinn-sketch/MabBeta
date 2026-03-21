import type { SupabaseClient } from "@supabase/supabase-js";

export const useMachines = () => {
  const { $supabase } = useNuxtApp() as { $supabase: SupabaseClient };

  const getMachines = async () => {
    const { data, error } = await $supabase
      .from("machines")
      .select("*")
      .order("name");

    return { data, error };
  };

  const getMachineLayoutPoints = async () => {
    const { data, error } = await $supabase
      .from("machine_layout_point")
      .select(
        `
        *,
        machine:machines(*)
      `
      )
      .order("created_at");

    return { data, error };
  };

  const getMachineAlarms = async (machineId?: string, activeOnly: boolean = false) => {
    let query = $supabase
      .from("machine_alarm")
      .select(
        `
        *,
        machine:machines(*)
      `
      )
      .order("start_time", { ascending: false });

    if (machineId) {
      query = query.eq("machine_id", machineId);
    }

    if (activeOnly) {
      // Get active alarms (no end_time or end_time is null)
      query = query.is("end_time", null);
    }

    const { data, error } = await query;
    return { data, error };
  };

  const getMachineStatusLog = async (machineId: string, limit: number = 50) => {
    const { data, error } = await $supabase
      .from("machine_status_log")
      .select("*")
      .eq("machine_id", machineId)
      .order("timestamp", { ascending: false })
      .limit(limit);

    return { data, error };
  };

  const getMachineOEE = async (machineId: string, days: number = 7) => {
    const { data, error } = await $supabase
      .from("machine_oee_daily")
      .select("*")
      .eq("machine_id", machineId)
      .order("date", { ascending: false })
      .limit(days);

    return { data, error };
  };

  return {
    getMachines,
    getMachineLayoutPoints,
    getMachineAlarms,
    getMachineStatusLog,
    getMachineOEE,
  };
};
