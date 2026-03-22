export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const { user, initSession } = useCustomAuth()

  // โหลด session จาก localStorage ถ้ายังไม่มี
  if (!user.value) {
    initSession()
  }

  const path = (to.path || '/').replace(/\/+$/, '') || '/'

  // หน้าที่ต้อง login + บัญชี active
  const protectedPaths = ['/', '/my-courses']
  const isProtected = protectedPaths.some(
    (p) => path === p || path.startsWith(p + '/')
  )

  // หน้า Admin (ต้อง super_admin)
  const isAdminPage = path === '/admin' || path.startsWith('/admin/')
  // ยกเว้น /admin/setup ที่เปิดให้ทุกคนเข้า
  const isAdminSetup = path === '/admin/setup'

  // หน้า Auth/Public
  const authPages = ['/login', '/signup', '/activate']
  const isAuthPage = authPages.includes(path)

  const currentUser = user.value

  // ============================================================
  // ยังไม่ได้ login
  // ============================================================
  if (!currentUser) {
    if (isProtected || (isAdminPage && !isAdminSetup)) {
      return navigateTo('/login')
    }
    return
  }

  // ============================================================
  // Login แล้ว แต่บัญชียังไม่ active (ยังไม่มี license)
  // ============================================================
  if (!currentUser.is_active) {
    if (isProtected || (isAdminPage && !isAdminSetup)) {
      return navigateTo('/activate')
    }
    return
  }

  // ============================================================
  // Login แล้ว + บัญชี active
  // ============================================================

  // ถ้าเข้าหน้า login/signup/activate → redirect ไปหน้าหลัก
  if (isAuthPage) {
    return navigateTo('/')
  }

  // ถ้าเข้าหน้า Admin แต่ไม่ใช่ super_admin → redirect ไปหน้าหลัก
  if (isAdminPage && !isAdminSetup && currentUser.role !== 'super_admin') {
    return navigateTo('/')
  }
})
