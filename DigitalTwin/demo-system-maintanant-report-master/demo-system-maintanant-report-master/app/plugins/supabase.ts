import { createClient, SupabaseClient } from "@supabase/supabase-js";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const supabase: SupabaseClient = createClient(
    config.public.SUPABASE_URL as string,
    config.public.SUPABASE_KEY as string
  );

  return {
    provide: {
      supabase,
    },
  };
});
