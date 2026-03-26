<template>
  <div style="min-height:100vh;background:#f1f5f9;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">

    <!-- ── Top Bar ── -->
    <header style="background:#fff;border-bottom:1px solid #e2e8f0;height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 32px;flex-shrink:0;box-shadow:0 1px 8px rgba(0,0,0,.06)">
      <div style="display:flex;align-items:center;gap:14px">
        <div style="width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,#7c3aed,#4f46e5);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(124,58,237,.35)">
          <svg width="20" height="20" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
        </div>
        <div>
          <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;letter-spacing:-.01em">MapBeta Digital Twin</p>
          <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
            <span style="width:6px;height:6px;border-radius:50%;background:#22c55e;display:inline-block;box-shadow:0 0 5px rgba(34,197,94,.5)"></span>
            <p style="margin:0;font-size:10px;color:#94a3b8;font-weight:600;letter-spacing:.07em;text-transform:uppercase">Super Admin Console</p>
          </div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <NuxtLink to="/admin"
          style="display:flex;align-items:center;gap:6px;font-size:13px;color:#475569;padding:8px 16px;border-radius:9px;text-decoration:none;font-weight:500;border:1px solid #e2e8f0;background:#fff;transition:all .15s"
          onmouseover="this.style.background='#f8fafc';this.style.borderColor='#cbd5e1';this.style.color='#0f172a'"
          onmouseout="this.style.background='#fff';this.style.borderColor='#e2e8f0';this.style.color='#475569'">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          จัดการผู้ใช้
        </NuxtLink>
        <div style="display:flex;align-items:center;gap:9px;padding:6px 14px 6px 8px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0">
          <div style="width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#7c3aed,#4f46e5);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;box-shadow:0 2px 8px rgba(124,58,237,.35)">
            {{ user?.full_name?.charAt(0)?.toUpperCase() || 'A' }}
          </div>
          <div>
            <p style="margin:0;font-size:12px;font-weight:600;color:#0f172a;line-height:1.2">{{ user?.full_name }}</p>
            <p style="margin:0;font-size:10px;color:#94a3b8;line-height:1.2">Administrator</p>
          </div>
        </div>
        <button @click="onLogout"
          style="display:flex;align-items:center;gap:6px;font-size:13px;color:#dc2626;padding:8px 16px;border-radius:9px;border:1px solid #fecaca;background:#fff;cursor:pointer;font-weight:500;transition:all .15s"
          onmouseover="this.style.background='#fef2f2';this.style.borderColor='#fca5a5'"
          onmouseout="this.style.background='#fff';this.style.borderColor='#fecaca'">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          ออกจากระบบ
        </button>
      </div>
    </header>

    <div style="flex:1;padding:28px 32px;display:flex;flex-direction:column;gap:24px;overflow-x:hidden">

      <!-- ── Page Title ── -->
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <h1 style="margin:0;font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-.02em">รายงานผู้ติดต่อ</h1>
          <p style="margin:4px 0 0;font-size:13px;color:#94a3b8">ข้อมูลผู้ที่กรอกแบบฟอร์มสมัครสมาชิก</p>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <!-- Search -->
          <div style="position:relative">
            <svg style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#94a3b8" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="M21 21l-4.35-4.35"/></svg>
            <input v-model="search" placeholder="ค้นหาชื่อ, อีเมล..." style="height:40px;padding:0 12px 0 32px;border:1px solid #e2e8f0;border-radius:10px;font-size:13px;color:#0f172a;background:#fff;outline:none;width:220px" @focus="$event.target.style.borderColor='#a78bfa'" @blur="$event.target.style.borderColor='#e2e8f0'" />
          </div>
          <button @click="loadData" :disabled="loading"
            style="height:40px;padding:0 20px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;font-size:13px;color:#475569;cursor:pointer;display:flex;align-items:center;gap:8px;font-weight:600;transition:all .15s;box-shadow:0 1px 3px rgba(0,0,0,.06)"
            onmouseover="this.style.background='#f8fafc';this.style.borderColor='#cbd5e1';this.style.color='#0f172a'"
            onmouseout="this.style.background='#fff';this.style.borderColor='#e2e8f0';this.style.color='#475569'">
            <svg :style="loading ? 'animation:spin 1s linear infinite' : ''" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            รีเฟรช
          </button>
        </div>
      </div>

      <!-- ── Stat Cards ── -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px">

        <div style="background:#fff;border-radius:16px;padding:22px;border:1px solid #e2e8f0;box-shadow:0 2px 8px rgba(0,0,0,.05)">
          <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em">ติดต่อทั้งหมด</p>
          <p style="margin:0 0 4px;font-size:38px;font-weight:800;color:#0f172a;letter-spacing:-.03em;line-height:1">{{ contacts.length }}</p>
          <p style="margin:0;font-size:12px;color:#94a3b8">รายการ</p>
        </div>

        <div style="background:#fff;border-radius:16px;padding:22px;border:1px solid #e2e8f0;border-left:4px solid #f59e0b;box-shadow:0 2px 8px rgba(0,0,0,.05)">
          <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#d97706;text-transform:uppercase;letter-spacing:.08em">รอดำเนินการ</p>
          <p style="margin:0 0 4px;font-size:38px;font-weight:800;color:#d97706;letter-spacing:-.03em;line-height:1">{{ contacts.filter(c => c.status === 'new').length }}</p>
          <p style="margin:0;font-size:12px;color:#fcd34d">รายการใหม่</p>
        </div>

        <div style="background:#fff;border-radius:16px;padding:22px;border:1px solid #e2e8f0;border-left:4px solid #3b82f6;box-shadow:0 2px 8px rgba(0,0,0,.05)">
          <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:.08em">ติดต่อแล้ว</p>
          <p style="margin:0 0 4px;font-size:38px;font-weight:800;color:#2563eb;letter-spacing:-.03em;line-height:1">{{ contacts.filter(c => c.status === 'contacted').length }}</p>
          <p style="margin:0;font-size:12px;color:#93c5fd">รายการ</p>
        </div>

        <div style="background:#fff;border-radius:16px;padding:22px;border:1px solid #e2e8f0;border-left:4px solid #22c55e;box-shadow:0 2px 8px rgba(0,0,0,.05)">
          <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:.08em">เสร็จสิ้น</p>
          <p style="margin:0 0 4px;font-size:38px;font-weight:800;color:#16a34a;letter-spacing:-.03em;line-height:1">{{ contacts.filter(c => c.status === 'done').length }}</p>
          <p style="margin:0;font-size:12px;color:#86efac">รายการ</p>
        </div>
      </div>

      <!-- ── Table ── -->
      <div style="background:#fff;border-radius:18px;border:1px solid #e2e8f0;box-shadow:0 2px 8px rgba(0,0,0,.05);overflow:hidden">

        <!-- Loading -->
        <div v-if="loading" style="padding:60px;text-align:center">
          <svg style="animation:spin 1s linear infinite;display:inline-block" width="32" height="32" fill="none" stroke="#a78bfa" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke-dasharray="36 20"/></svg>
          <p style="margin:12px 0 0;font-size:13px;color:#94a3b8">กำลังโหลด...</p>
        </div>

        <!-- Empty -->
        <div v-else-if="filteredContacts.length === 0" style="padding:60px;text-align:center">
          <svg width="48" height="48" fill="none" stroke="#cbd5e1" stroke-width="1.5" viewBox="0 0 24 24" style="margin:0 auto 12px"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"/></svg>
          <p style="margin:0;font-size:14px;color:#94a3b8;font-weight:500">ไม่พบข้อมูลผู้ติดต่อ</p>
        </div>

        <!-- Table -->
        <table v-else style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="border-bottom:2px solid #f1f5f9">
              <th style="padding:14px 20px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em">ชื่อ</th>
              <th style="padding:14px 20px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em">บริษัท / หน่วยงาน</th>
              <th style="padding:14px 20px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em">อีเมล</th>
              <th style="padding:14px 20px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em">เบอร์โทร</th>
              <th style="padding:14px 20px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em">รายละเอียด</th>
              <th style="padding:14px 20px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em">วันที่</th>
              <th style="padding:14px 20px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em">สถานะ</th>
              <th style="padding:14px 20px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="c in filteredContacts" :key="c.id">
              <tr style="border-bottom:1px solid #f1f5f9;transition:background .12s" @mouseenter="$event.currentTarget.style.background='#fafafa'" @mouseleave="$event.currentTarget.style.background='transparent'">
                <!-- Name -->
                <td style="padding:16px 20px">
                  <div style="display:flex;align-items:center;gap:10px">
                    <div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#4f46e5);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0">
                      {{ c.name?.charAt(0)?.toUpperCase() || '?' }}
                    </div>
                    <span style="font-size:13px;font-weight:600;color:#0f172a">{{ c.name }}</span>
                  </div>
                </td>
                <!-- Org -->
                <td style="padding:16px 20px;font-size:13px;color:#475569">{{ c.organization || '-' }}</td>
                <!-- Email -->
                <td style="padding:16px 20px">
                  <a :href="'mailto:' + c.email" style="font-size:13px;color:#4f46e5;text-decoration:none;font-weight:500">{{ c.email }}</a>
                </td>
                <!-- Phone -->
                <td style="padding:16px 20px">
                  <a :href="'tel:' + c.phone" style="font-size:13px;color:#475569;text-decoration:none">{{ c.phone || '-' }}</a>
                </td>
                <!-- Notes -->
                <td style="padding:16px 20px;max-width:260px">
                  <span v-if="c.notes" style="font-size:12.5px;color:#475569;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">{{ c.notes }}</span>
                  <span v-else style="font-size:12px;color:#cbd5e1">-</span>
                </td>
                <!-- Date -->
                <td style="padding:16px 20px;font-size:12px;color:#94a3b8;white-space:nowrap">{{ formatDate(c.created_at) }}</td>
                <!-- Status -->
                <td style="padding:16px 20px">
                  <span :style="statusBadgeStyle(c.status)">{{ statusLabel(c.status) }}</span>
                </td>
                <!-- Actions -->
                <td style="padding:16px 20px">
                  <div style="display:flex;align-items:center;gap:6px">
                    <button @click="changeStatus(c, 'contacted')" title="ติดต่อแล้ว"
                      style="height:30px;padding:0 12px;border-radius:7px;border:1px solid #bfdbfe;background:#eff6ff;color:#2563eb;font-size:11px;font-weight:600;cursor:pointer;transition:all .12s"
                      onmouseover="this.style.background='#dbeafe'" onmouseout="this.style.background='#eff6ff'">
                      ติดต่อแล้ว
                    </button>
                    <button @click="changeStatus(c, 'done')" title="เสร็จสิ้น"
                      style="height:30px;padding:0 12px;border-radius:7px;border:1px solid #bbf7d0;background:#f0fdf4;color:#16a34a;font-size:11px;font-weight:600;cursor:pointer;transition:all .12s"
                      onmouseover="this.style.background='#dcfce7'" onmouseout="this.style.background='#f0fdf4'">
                      เสร็จสิ้น
                    </button>
                    <button @click="toggleNote(c.id)" title="ดูรายละเอียด"
                      style="height:30px;width:30px;border-radius:7px;border:1px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s"
                      onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#f8fafc'">
                      <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
              <!-- Notes row -->
              <tr v-if="expandedId === c.id && c.notes" style="background:#fafafa;border-bottom:1px solid #f1f5f9">
                <td colspan="8" style="padding:12px 20px 16px 74px">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px">รายละเอียดเพิ่มเติม</p>
                  <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;white-space:pre-wrap">{{ c.notes }}</p>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'empty' })
useHead({ title: 'ผู้ติดต่อ | Admin' })

const { $supabase } = useNuxtApp() as any
const { user, signOut, initSession } = useCustomAuth()

onMounted(() => { initSession(); loadData() })

const onLogout = () => { signOut(); navigateTo('/login') }

const contacts = ref<any[]>([])
const loading = ref(false)
const search = ref('')
const expandedId = ref<string | null>(null)

const filteredContacts = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return contacts.value
  return contacts.value.filter(c =>
    c.name?.toLowerCase().includes(q) ||
    c.email?.toLowerCase().includes(q) ||
    c.organization?.toLowerCase().includes(q) ||
    c.phone?.includes(q)
  )
})

const loadData = async () => {
  loading.value = true
  const { data, error } = await $supabase
    .from('contact_requests')
    .select('*')
    .order('created_at', { ascending: false })
  if (!error) contacts.value = data || []
  loading.value = false
}

const changeStatus = async (contact: any, status: string) => {
  await $supabase
    .from('contact_requests')
    .update({ status })
    .eq('id', contact.id)
  contact.status = status
}

const toggleNote = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id
}

const formatDate = (iso: string) => {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const statusLabel = (s: string) => {
  if (s === 'contacted') return 'ติดต่อแล้ว'
  if (s === 'done') return 'เสร็จสิ้น'
  return 'ใหม่'
}

const statusBadgeStyle = (s: string) => {
  const base = 'display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;'
  if (s === 'contacted') return base + 'background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe'
  if (s === 'done') return base + 'background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0'
  return base + 'background:#fffbeb;color:#d97706;border:1px solid #fde68a'
}

</script>

<style scoped>
@keyframes spin { to { transform: rotate(360deg); } }
</style>
