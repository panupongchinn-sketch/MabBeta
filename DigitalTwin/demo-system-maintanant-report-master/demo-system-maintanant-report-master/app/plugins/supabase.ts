import { createClient, SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://ezaccpveuyilyfownpzs.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_lu9mwNQ95NC6C2ajzQSSXg_pqzEIfMA";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const supabaseUrl = (config.public.SUPABASE_URL as string) || DEFAULT_SUPABASE_URL;
  const supabaseKey = (config.public.SUPABASE_KEY as string) || DEFAULT_SUPABASE_PUBLISHABLE_KEY;

  const supabase: SupabaseClient = createClient(
    supabaseUrl,
    supabaseKey
  );

  return {
    provide: {
      supabase,
    },
  };
});
