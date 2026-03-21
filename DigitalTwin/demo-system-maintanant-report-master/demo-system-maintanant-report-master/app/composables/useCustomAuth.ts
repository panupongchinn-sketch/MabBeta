// composables/useCustomAuth.ts
// ระบบ Auth แบบกำหนดเอง ไม่ใช้ Supabase Auth
// เก็บข้อมูลลง table app_users ใน Supabase database

const SESSION_KEY = 'dt_session'

// ============================================================
// Password Hashing ด้วย Web Crypto API (built-in browser)
// ============================================================
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  const encoder = new TextEncoder()
  const data = encoder.encode(saltHex + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${saltHex}:${hashHex}`
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':')
  if (parts.length !== 2) return false
  const [saltHex, hashHex] = parts
  const encoder = new TextEncoder()
  const data = encoder.encode(saltHex + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const computedHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  return computedHash === hashHex
}

// ============================================================
// Generate License Key (format: XXXXX-XXXXX-XXXXX-XXXXX)
// ============================================================
function generateLicenseKeyString(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length: 4 }, () =>
    Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  ).join('-')
}

// ============================================================
// Composable
// ============================================================
export const useCustomAuth = () => {
  const { $supabase } = useNuxtApp() as any

  // State ผู้ใช้ปัจจุบัน (share ทั้ง app)
  const user = useState<any | null>('custom_auth_user', () => null)

  const isLoggedIn = computed(() => !!user.value)
  const isActive = computed(() => user.value?.is_active === true)
  const isSuperAdmin = computed(() => user.value?.role === 'super_admin')

  // ============================================================
  // initSession - โหลด session จาก localStorage (sync-safe สำหรับ middleware)
  // ============================================================
  const initSession = () => {
    if (process.server) return
    if (user.value) return
    try {
      const stored = localStorage.getItem(SESSION_KEY)
      if (stored) user.value = JSON.parse(stored)
    } catch {
      localStorage.removeItem(SESSION_KEY)
    }
  }


  // ============================================================
  // signUp - สมัครสมาชิก (เก็บลง app_users)
  // ============================================================
  const signUp = async (email: string, password: string, fullName: string, organization?: string) => {
    // ตรวจสอบว่า email ซ้ำหรือไม่
    const { data: existing } = await $supabase
      .from('app_users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (existing) {
      return { data: null, error: { message: 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น' } }
    }

    const password_hash = await hashPassword(password)

    const { data, error } = await $supabase
      .from('app_users')
      .insert({
        full_name: fullName.trim(),
        email: email.toLowerCase().trim(),
        organization: organization?.trim() || null,
        password_hash,
        role: 'user',
        is_active: false,
      })
      .select('id, full_name, email, organization, role, is_active, created_at')
      .single()

    return { data, error }
  }

  // ============================================================
  // signIn - เข้าสู่ระบบ
  // ============================================================
  const signIn = async (email: string, password: string) => {
    const { data: userData, error } = await $supabase
      .from('app_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (error || !userData) {
      return { data: null, error: { message: 'ไม่พบบัญชีผู้ใช้ กรุณาตรวจสอบอีเมล' } }
    }

    const valid = await verifyPassword(password, userData.password_hash)
    if (!valid) {
      return { data: null, error: { message: 'รหัสผ่านไม่ถูกต้อง' } }
    }

    // อัปเดตเวลา login ล่าสุด
    await $supabase
      .from('app_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userData.id)

    // เก็บ session (ไม่รวม password_hash)
    const { password_hash: _pw, ...sessionUser } = userData
    user.value = sessionUser
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))

    return { data: sessionUser, error: null }
  }

  // ============================================================
  // signOut - ออกจากระบบ
  // ============================================================
  const signOut = () => {
    user.value = null
    localStorage.removeItem(SESSION_KEY)
  }

  // ============================================================
  // activateLicense - กรอก License Key เพื่อเปิดใช้งานบัญชี
  // ============================================================
  const activateLicense = async (licenseKey: string) => {
    if (!user.value) return { error: { message: 'กรุณาเข้าสู่ระบบก่อน' } }

    const normalizedKey = licenseKey.trim().toUpperCase()

    const { data: license, error: licErr } = await $supabase
      .from('license_keys')
      .select('*')
      .eq('key', normalizedKey)
      .maybeSingle()

    if (licErr || !license) {
      return { error: { message: 'ไม่พบ License Key นี้ กรุณาตรวจสอบอีกครั้ง' } }
    }

    if (license.is_used) {
      return { error: { message: 'License Key นี้ถูกใช้งานไปแล้ว' } }
    }

    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return { error: { message: 'License Key นี้หมดอายุแล้ว' } }
    }

    const now = new Date().toISOString()

    // Mark license as used
    await $supabase
      .from('license_keys')
      .update({ is_used: true, used_by: user.value.id, used_at: now })
      .eq('id', license.id)

    // Activate user
    await $supabase
      .from('app_users')
      .update({ is_active: true, license_key_id: license.id })
      .eq('id', user.value.id)

    // Update local session
    user.value = { ...user.value, is_active: true, license_key_id: license.id }
    localStorage.setItem(SESSION_KEY, JSON.stringify(user.value))

    return { error: null }
  }

  // ============================================================
  // refreshUser - โหลดข้อมูลผู้ใช้ใหม่จาก DB
  // ============================================================
  const refreshUser = async () => {
    if (!user.value?.id) return
    const { data } = await $supabase
      .from('app_users')
      .select('id, full_name, email, role, is_active, created_at, last_login_at, license_key_id')
      .eq('id', user.value.id)
      .single()
    if (data) {
      user.value = data
      localStorage.setItem(SESSION_KEY, JSON.stringify(data))
    }
  }

  // ============================================================
  // Admin Functions
  // ============================================================

  const getAllUsers = async () => {
    const { data, error } = await $supabase
      .from('app_users')
      .select('id, full_name, email, organization, role, is_active, created_at, last_login_at')
      .order('created_at', { ascending: false })
    return { data, error }
  }

  const toggleUserActive = async (userId: string, isActiveVal: boolean) => {
    const { error } = await $supabase
      .from('app_users')
      .update({ is_active: isActiveVal })
      .eq('id', userId)
    return { error }
  }

  const changeUserRole = async (userId: string, role: string) => {
    const { error } = await $supabase
      .from('app_users')
      .update({ role })
      .eq('id', userId)
    return { error }
  }

  const deleteUser = async (userId: string) => {
    const { error } = await $supabase
      .from('app_users')
      .delete()
      .eq('id', userId)
    return { error }
  }

  const getAllLicenseKeys = async () => {
    const { data, error } = await $supabase
      .from('license_keys')
      .select('*, used_user:app_users!license_keys_used_by_fkey(full_name, email)')
      .order('created_at', { ascending: false })
    return { data, error }
  }

  const generateLicenseKeys = async (count: number, expiresAt?: string | null, note?: string) => {
    if (!user.value?.id) return { data: null, error: { message: 'Not authenticated' } }

    const keys = Array.from({ length: count }, () => ({
      key: generateLicenseKeyString(),
      created_by: user.value.id,
      expires_at: expiresAt || null,
      note: note || null,
    }))

    const { data, error } = await $supabase
      .from('license_keys')
      .insert(keys)
      .select()
    return { data, error }
  }

  const deleteLicenseKey = async (keyId: string) => {
    const { error } = await $supabase
      .from('license_keys')
      .delete()
      .eq('id', keyId)
    return { error }
  }

  const getAllUsersWithLicenses = async () => {
    const { data: users, error } = await $supabase
      .from('app_users')
      .select('id, full_name, email, organization, role, is_active, created_at, last_login_at, license_key_id')
      .order('created_at', { ascending: false })
    if (error || !users) return { data: [], error }

    const { data: licenses } = await $supabase
      .from('license_keys')
      .select('id, key, is_used, used_by, expires_at, note, created_at')

    const { data: projects } = await $supabase
      .from('saved_projects')
      .select('owner_id')

    const licenseMap: Record<string, any> = {}
    for (const l of licenses || []) licenseMap[l.id] = l

    const projectCounts: Record<string, number> = {}
    for (const p of projects || []) {
      projectCounts[p.owner_id] = (projectCounts[p.owner_id] || 0) + 1
    }

    const data = users.map((u: any) => ({
      ...u,
      license: u.license_key_id ? licenseMap[u.license_key_id] || null : null,
      project_count: projectCounts[u.id] || 0,
    }))
    return { data, error: null }
  }

  const generateAndAssignLicense = async (userId: string, expiresAt: string | null, note: string | null) => {
    if (!user.value?.id) return { data: null, error: { message: 'Not authenticated' } }
    const key = generateLicenseKeyString()
    const { data: lic, error: licErr } = await $supabase
      .from('license_keys')
      .insert({ key, created_by: user.value.id, expires_at: expiresAt || null, note: note || null, is_used: true, used_by: userId, used_at: new Date().toISOString() })
      .select()
      .single()
    if (licErr) return { data: null, error: licErr }
    const { error: userErr } = await $supabase
      .from('app_users')
      .update({ is_active: true, license_key_id: lic.id })
      .eq('id', userId)
    return { data: lic, error: userErr }
  }

  const extendLicense = async (licenseId: string, newExpiresAt: string) => {
    const { error } = await $supabase
      .from('license_keys')
      .update({ expires_at: newExpiresAt })
      .eq('id', licenseId)
    return { error }
  }

  const revokeUserLicense = async (userId: string, licenseId: string) => {
    const { error: e1 } = await $supabase
      .from('app_users')
      .update({ is_active: false, license_key_id: null })
      .eq('id', userId)
    if (e1) return { error: e1 }
    const { error: e2 } = await $supabase
      .from('license_keys')
      .update({ is_used: false, used_by: null })
      .eq('id', licenseId)
    return { error: e2 }
  }

  // ตรวจสอบว่ามี super_admin ในระบบแล้วหรือยัง
  const hasSuperAdmin = async () => {
    const { data } = await $supabase
      .from('app_users')
      .select('id')
      .eq('role', 'super_admin')
      .limit(1)
      .maybeSingle()
    return !!data
  }

  // สร้าง / อัปเกรด Super Admin (ใช้ใน /admin/setup)
  const createFirstSuperAdmin = async (email: string, password: string, fullName: string) => {
    const normalizedEmail = email.toLowerCase().trim()
    const password_hash = await hashPassword(password)

    // ถ้า account มีอยู่แล้ว → update role เป็น super_admin + reset password
    const { data: existing } = await $supabase
      .from('app_users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existing) {
      const { data, error } = await $supabase
        .from('app_users')
        .update({ role: 'super_admin', is_active: true, full_name: fullName.trim(), password_hash })
        .eq('id', existing.id)
        .select('id, full_name, email, role, is_active, created_at')
        .single()
      return { data, error }
    }

    // ถ้ายังไม่มี account → สร้างใหม่
    const { data, error } = await $supabase
      .from('app_users')
      .insert({
        full_name: fullName.trim(),
        email: normalizedEmail,
        password_hash,
        role: 'super_admin',
        is_active: true,
      })
      .select('id, full_name, email, role, is_active, created_at')
      .single()

    return { data, error }
  }

  return {
    user,
    isLoggedIn,
    isActive,
    isSuperAdmin,
    initSession,
    signUp,
    signIn,
    signOut,
    activateLicense,
    refreshUser,
    getAllUsers,
    toggleUserActive,
    changeUserRole,
    deleteUser,
    getAllLicenseKeys,
    generateLicenseKeys,
    deleteLicenseKey,
    getAllUsersWithLicenses,
    generateAndAssignLicense,
    extendLicense,
    revokeUserLicense,
    hasSuperAdmin,
    createFirstSuperAdmin,
  }
}
