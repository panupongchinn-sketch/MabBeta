// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  app: {
    head: {
      title: "MapBeta Digital Twin",
      link: [{ rel: "icon", type: "image/png", href: "/logo.png" }],
    },
  },
  nitro: {
    preset: "static",
    prerender: {
      ignore: ['/my-courses', '/my-courses/**'],
    },
  },
  routeRules: {
    '/my-courses': { ssr: false },
    '/my-courses/**': { ssr: false },
  },
  css: ["./app/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        '/air4thai-proxy': {
          target: 'https://air4thai.pcd.go.th',
          changeOrigin: true,
          rewrite: (path: string) => path.replace('/air4thai-proxy', '/services/getAQI_JSON.php'),
        },
      },
    },
  },
  runtimeConfig: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    MEPBETA_TRAFFIC_API_URL: process.env.MEPBETA_TRAFFIC_API_URL,
    MEPBETA_LIGHTING_API_URL: process.env.MEPBETA_LIGHTING_API_URL,
    MEPBETA_CCTV_API_URL: process.env.MEPBETA_CCTV_API_URL,
    MEPBETA_WATER_API_URL: process.env.MEPBETA_WATER_API_URL,
    MEPBETA_AIR_QUALITY_API_URL: process.env.MEPBETA_AIR_QUALITY_API_URL,
    MEPBETA_WEATHER_API_URL: process.env.MEPBETA_WEATHER_API_URL,
    MEPBETA_GIS_API_URL: process.env.MEPBETA_GIS_API_URL,
    MEPBETA_PULL_INTERVAL_MS: process.env.MEPBETA_PULL_INTERVAL_MS,
    MEPBETA_SCHEDULER_ENABLED: process.env.MEPBETA_SCHEDULER_ENABLED,
    public: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_KEY: process.env.SUPABASE_KEY,
    },
  },
});
