// composables/useAuth.ts
export const useAuth = () => {
  const { $supabase } = useNuxtApp() as any

  // เก็บ user ไว้ใช้ทั้งเว็บ
  const user = useState<any | null>("auth_user", () => null)

  const getSession = async () => {
    const { data, error } = await $supabase.auth.getSession()
    if (!error) user.value = data?.session?.user ?? null
    return { session: data?.session ?? null, error }
  }

  // ✅ สมัครสมาชิก + เก็บชื่อไว้ใน user_metadata.full_name
  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await $supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: (fullName || "").trim(),
        },
        // ถ้ามึงเปิด email confirm ไว้ อยากให้เด้งกลับเว็บตอนกดยืนยัน
        // emailRedirectTo: `${window.location.origin}/login`,
      },
    })

    // ถ้า supabase ส่ง session กลับมา (กรณีไม่ต้อง confirm) ก็อัปเดต user
    if (!error) user.value = data?.user ?? user.value
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await $supabase.auth.signInWithPassword({ email, password })
    if (!error) user.value = data?.user ?? null
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await $supabase.auth.signOut()
    if (!error) user.value = null
    return { error }
  }

  return {
    user,
    getSession,
    signUp,     // ✅ ต้องมีตัวนี้ ไม่งั้นหน้า signup จะฟ้อง
    signIn,
    signOut,
  }
}
