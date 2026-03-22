<template>
  <div class="admin-root">

    <!-- ── Sidebar ── -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">
          <svg width="18" height="18" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
        </div>
        <div>
          <p class="logo-title">MapBeta</p>
          <p class="logo-sub">Digital Twin</p>
        </div>
      </div>

      <nav class="sidebar-nav">
        <p class="nav-section-label">MAIN</p>
        <NuxtLink to="/admin" class="nav-item nav-item-active">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          Dashboard
        </NuxtLink>
        <NuxtLink to="/admin/contacts" class="nav-item">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"/></svg>
          ผู้ติดต่อ
        </NuxtLink>

        <p class="nav-section-label" style="margin-top:24px">SYSTEM</p>
        <NuxtLink to="/" class="nav-item">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          หน้าหลัก
        </NuxtLink>
      </nav>

      <div class="sidebar-footer">
        <div class="user-avatar">{{ user?.full_name?.charAt(0)?.toUpperCase() || 'A' }}</div>
        <div class="user-info">
          <p class="user-name">{{ user?.full_name }}</p>
          <p class="user-role">Administrator</p>
        </div>
        <button @click="onLogout" class="logout-btn" title="ออกจากระบบ">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
        </button>
      </div>
    </aside>

    <!-- ── Main ── -->
    <div class="main-wrap">

      <!-- Top Header -->
      <header class="top-header">
        <div>
          <h1 class="page-title">จัดการผู้ใช้งาน</h1>
          <p class="page-sub">ดูแลและจัดการ License สำหรับผู้ใช้ทั้งหมดในระบบ</p>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <button @click="loadData" :disabled="loading" class="refresh-btn">
            <svg :style="loading ? 'animation:spin 1s linear infinite' : ''" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            รีเฟรช
          </button>
        </div>
      </header>

      <div class="content-area">

        <!-- KPI Cards -->
        <div class="kpi-grid">

          <div class="kpi-card">
            <div class="kpi-icon" style="background:#f5f3ff;color:#7c3aed">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <div>
              <p class="kpi-value" style="color:#0f172a">{{ stats.total }}</p>
              <p class="kpi-label">Total Users</p>
            </div>
          </div>

          <div class="kpi-card" style="border-left:3px solid #22c55e">
            <div class="kpi-icon" style="background:#f0fdf4;color:#16a34a">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <p class="kpi-value" style="color:#16a34a">{{ stats.active }}</p>
              <p class="kpi-label">Active License</p>
            </div>
          </div>

          <div class="kpi-card" style="border-left:3px solid #f59e0b">
            <div class="kpi-icon" style="background:#fffbeb;color:#d97706">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <p class="kpi-value" style="color:#d97706">{{ stats.expired }}</p>
              <p class="kpi-label">Expired</p>
            </div>
          </div>

          <div class="kpi-card" style="border-left:3px solid #94a3b8">
            <div class="kpi-icon" style="background:#f8fafc;color:#64748b">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
            </div>
            <div>
              <p class="kpi-value" style="color:#64748b">{{ stats.noLicense }}</p>
              <p class="kpi-label">No License</p>
            </div>
          </div>

          <div class="kpi-card" style="border-left:3px solid #3b82f6">
            <div class="kpi-icon" style="background:#eff6ff;color:#2563eb">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
            </div>
            <div>
              <p class="kpi-value" style="color:#2563eb">{{ stats.projects }}</p>
              <p class="kpi-label">Total Projects</p>
            </div>
          </div>

        </div>

        <!-- Table Card -->
        <div class="table-card">

          <!-- Controls Row -->
          <div class="table-controls">
            <!-- Filter Tabs -->
            <div class="filter-tabs">
              <button v-for="f in filters" :key="f.key" @click="activeFilter = f.key"
                class="filter-tab" :class="activeFilter === f.key ? 'filter-tab-active' : ''">
                {{ f.label }}
                <span v-if="f.key !== 'all'" class="filter-count">{{ getFilterCount(f.key) }}</span>
              </button>
            </div>

            <!-- Search -->
            <div class="search-wrap">
              <svg class="search-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="m21 21-4.35-4.35"/>
              </svg>
              <input v-model="search" type="text" placeholder="ค้นหาชื่อ, อีเมล, License Key..." class="search-input"/>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="loading-wrap">
            <div class="spinner"></div>
            <p style="font-size:13px;color:#94a3b8;margin:0">กำลังโหลดข้อมูล...</p>
          </div>

          <!-- Table -->
          <div v-else style="overflow-x:auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>ชื่อ / หน่วยงาน</th>
                  <th>อีเมล</th>
                  <th style="text-align:center">โปรเจค</th>
                  <th>License Key</th>
                  <th>ประเภท</th>
                  <th>วันหมดอายุ</th>
                  <th>สถานะ</th>
                  <th style="text-align:right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredRows.length === 0">
                  <td colspan="9" class="empty-state">
                    <div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:60px">
                      <div class="empty-icon">
                        <svg width="24" height="24" fill="none" stroke="#cbd5e1" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
                      </div>
                      <p style="font-size:14px;color:#475569;font-weight:600;margin:0">ไม่พบข้อมูล</p>
                      <p style="font-size:12px;color:#94a3b8;margin:0">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
                    </div>
                  </td>
                </tr>

                <tr v-for="(row, idx) in filteredRows" :key="row.id" class="table-row">

                  <!-- วันที่ -->
                  <td style="white-space:nowrap">
                    <p class="text-sm text-muted">{{ formatDate(row.created_at) }}</p>
                  </td>

                  <!-- ชื่อ -->
                  <td style="white-space:nowrap">
                    <div style="display:flex;align-items:center;gap:10px">
                      <div class="avatar">{{ row.full_name?.charAt(0)?.toUpperCase() || '?' }}</div>
                      <div>
                        <p class="text-name">{{ row.full_name }}
                          <span v-if="row.role === 'super_admin'" style="color:#f59e0b;font-size:12px"> ★</span>
                        </p>
                        <p v-if="row.organization" class="text-org">{{ row.organization }}</p>
                      </div>
                    </div>
                  </td>

                  <!-- อีเมล -->
                  <td style="white-space:nowrap">
                    <p class="text-sm text-muted">{{ row.email }}</p>
                  </td>

                  <!-- โปรเจค -->
                  <td style="text-align:center">
                    <span class="badge-count" :class="row.project_count > 0 ? 'badge-count-blue' : 'badge-count-gray'">
                      {{ row.project_count }}
                    </span>
                  </td>

                  <!-- License Key -->
                  <td>
                    <div v-if="row.license" style="display:flex;align-items:center;gap:6px">
                      <code class="license-key">{{ row.license.key }}</code>
                      <button @click="() => { navigator.clipboard.writeText(row.license.key); showToast('คัดลอกแล้ว', 'success') }" class="copy-btn" title="คัดลอก">
                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                      </button>
                    </div>
                    <span v-else class="text-empty">—</span>
                  </td>

                  <!-- ประเภท -->
                  <td style="white-space:nowrap">
                    <span v-if="row.license" class="text-sm" style="color:#475569">{{ getLicenseType(row.license) }}</span>
                    <span v-else class="text-empty">—</span>
                  </td>

                  <!-- วันหมดอายุ -->
                  <td style="white-space:nowrap">
                    <template v-if="row.license?.expires_at">
                      <p class="text-sm" style="color:#334155;margin:0">{{ formatDate(row.license.expires_at) }}</p>
                      <p class="text-days" :class="daysLeft(row.license.expires_at) <= 30 ? 'days-red' : daysLeft(row.license.expires_at) <= 90 ? 'days-amber' : 'days-gray'">
                        เหลือ {{ daysLeft(row.license.expires_at) }} วัน
                      </p>
                    </template>
                    <span v-else class="text-empty">—</span>
                  </td>

                  <!-- สถานะ -->
                  <td>
                    <span class="status-badge" :class="!row.license ? 'status-none' : isExpiredLic(row.license) ? 'status-expired' : 'status-active'">
                      <span class="status-dot"></span>
                      {{ getStatusText(row) }}
                    </span>
                  </td>

                  <!-- Actions -->
                  <td style="text-align:right;white-space:nowrap">
                    <div v-if="row.id !== user?.id" style="display:inline-flex;align-items:center;gap:6px">
                      <button v-if="!row.license" @click="openGenModal(row)" class="action-btn action-gen" title="สร้าง License">
                        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                        Gen
                      </button>
                      <template v-else>
                        <button @click="openRenewModal(row)" :disabled="actionBusy === row.id" class="action-btn action-renew" title="ต่ออายุ">
                          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                          ต่ออายุ
                        </button>
                        <button @click="openRevokeConfirm(row)" :disabled="actionBusy === row.id" class="action-btn action-revoke" title="ยกเลิก">
                          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                          ยกเลิก
                        </button>
                      </template>
                    </div>
                    <span v-else class="badge-you">(คุณ)</span>
                  </td>

                </tr>
              </tbody>
            </table>

            <div class="table-footer">
              <p style="margin:0;font-size:12px;color:#94a3b8">
                แสดง <strong style="color:#475569">{{ filteredRows.length }}</strong> จาก <strong style="color:#475569">{{ rows.length }}</strong> ผู้ใช้
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- ── Modal: Gen License ── -->
    <Transition name="modal">
      <div v-if="genModal.open" class="modal-overlay" @click.self="genModal.open=false">
        <div class="modal-box">
          <div class="modal-header">
            <div class="modal-icon" style="background:#eff6ff;border-color:#bfdbfe">
              <svg width="20" height="20" fill="none" stroke="#2563eb" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
            </div>
            <div>
              <h3 class="modal-title">สร้าง License Key</h3>
              <p class="modal-sub">{{ genModal.user?.full_name }} · {{ genModal.user?.email }}</p>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:22px">
            <div>
              <label class="field-label">วันหมดอายุ</label>
              <input v-model="genModal.expiresAt" type="date" class="field-input"/>
            </div>
            <div>
              <label class="field-label">ประเภท / หมายเหตุ</label>
              <input v-model="genModal.note" type="text" placeholder="เช่น 1 ปี, 1 ปี (5 users)" class="field-input"/>
            </div>
          </div>
          <div style="display:flex;gap:10px">
            <button @click="genModal.open=false" class="btn-cancel">ยกเลิก</button>
            <button @click="onGenLicense" :disabled="genModal.loading" class="btn-primary" style="flex:2;background:linear-gradient(135deg,#0ea5e9,#0284c7);box-shadow:0 4px 14px rgba(14,165,233,.3)">
              <span v-if="genModal.loading" class="btn-spinner"></span>
              {{ genModal.loading ? 'กำลังสร้าง...' : '+ สร้าง License Key' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Modal: Renew ── -->
    <Transition name="modal">
      <div v-if="renewModal.open" class="modal-overlay" @click.self="renewModal.open=false">
        <div class="modal-box">
          <div class="modal-header">
            <div class="modal-icon" style="background:#f0fdf4;border-color:#bbf7d0">
              <svg width="20" height="20" fill="none" stroke="#16a34a" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </div>
            <div>
              <h3 class="modal-title">ต่ออายุ License</h3>
              <p class="modal-sub">{{ renewModal.user?.full_name }}</p>
            </div>
          </div>
          <div style="margin-bottom:22px">
            <label class="field-label">วันหมดอายุใหม่</label>
            <input v-model="renewModal.newExpiry" type="date" class="field-input"/>
          </div>
          <div style="display:flex;gap:10px">
            <button @click="renewModal.open=false" class="btn-cancel">ยกเลิก</button>
            <button @click="onRenew" :disabled="renewModal.loading||!renewModal.newExpiry" class="btn-primary" style="flex:2;background:linear-gradient(135deg,#22c55e,#16a34a);box-shadow:0 4px 14px rgba(34,197,94,.3)">
              <span v-if="renewModal.loading" class="btn-spinner"></span>
              {{ renewModal.loading ? 'กำลังบันทึก...' : '+ ต่ออายุ License' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Modal: Revoke ── -->
    <Transition name="modal">
      <div v-if="revokeTarget" class="modal-overlay" @click.self="revokeTarget=null">
        <div class="modal-box" style="text-align:center;border:1px solid #fecaca">
          <div style="width:56px;height:56px;border-radius:50%;background:#fef2f2;border:1.5px solid #fecaca;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
            <svg width="24" height="24" fill="none" stroke="#dc2626" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <h3 style="margin:0 0 8px;font-size:17px;font-weight:700;color:#0f172a">ยืนยันการยกเลิก License</h3>
          <p style="margin:0 0 24px;font-size:13px;color:#64748b;line-height:1.7">คุณกำลังจะยกเลิก License ของ <strong style="color:#0f172a">{{ revokeTarget.full_name }}</strong><br/>บัญชีจะถูกปิดการใช้งานทันที</p>
          <div style="display:flex;gap:10px">
            <button @click="revokeTarget=null" class="btn-cancel">ยกเลิก</button>
            <button @click="onRevoke" :disabled="actionBusy===revokeTarget?.id" class="btn-primary" style="flex:1;background:linear-gradient(135deg,#ef4444,#dc2626);box-shadow:0 4px 14px rgba(220,38,38,.3)">ยืนยัน</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Toast ── -->
    <Transition name="toast">
      <div v-if="toast" class="toast" :class="toast.type === 'success' ? 'toast-success' : 'toast-error'">
        <svg v-if="toast.type==='success'" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
        <svg v-else width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        {{ toast.msg }}
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'empty' })
useHead({ title: 'Admin | MapBeta' })

const { user, signOut, initSession, getAllUsersWithLicenses, generateAndAssignLicense, extendLicense, revokeUserLicense } = useCustomAuth()

const rows         = ref<any[]>([])
const loading      = ref(false)
const search       = ref('')
const activeFilter = ref('all')
const actionBusy   = ref<string | null>(null)
const revokeTarget = ref<any>(null)
const toast        = ref<{ msg: string; type: string } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

const filters = [
  { key: 'all',       label: 'ทั้งหมด' },
  { key: 'active',    label: 'Active' },
  { key: 'expired',   label: 'Expired' },
  { key: 'noLicense', label: 'No License' },
]

const genModal   = ref({ open: false, user: null as any, expiresAt: '', note: '', loading: false })
const renewModal = ref({ open: false, user: null as any, newExpiry: '', loading: false })

const loadData = async () => {
  loading.value = true
  const { data } = await getAllUsersWithLicenses()
  rows.value = (data || []).filter((u: any) => u.role !== 'super_admin')
  loading.value = false
}

const stats = computed(() => ({
  total:     rows.value.length,
  active:    rows.value.filter(r => r.is_active && r.license && !isExpiredLic(r.license)).length,
  expired:   rows.value.filter(r => r.license && isExpiredLic(r.license)).length,
  noLicense: rows.value.filter(r => !r.license).length,
  projects:  rows.value.reduce((s: number, r: any) => s + (r.project_count || 0), 0),
}))

const getFilterCount = (key: string) => {
  if (key === 'active')    return stats.value.active
  if (key === 'expired')   return stats.value.expired
  if (key === 'noLicense') return stats.value.noLicense
  return 0
}

const filteredRows = computed(() => {
  let list = rows.value
  const q = search.value.toLowerCase()
  if (q) list = list.filter(r =>
    r.full_name?.toLowerCase().includes(q) ||
    r.email?.toLowerCase().includes(q) ||
    r.organization?.toLowerCase().includes(q) ||
    r.license?.key?.toLowerCase().includes(q)
  )
  if (activeFilter.value === 'active')    list = list.filter(r => r.is_active && r.license && !isExpiredLic(r.license))
  if (activeFilter.value === 'expired')   list = list.filter(r => r.license && isExpiredLic(r.license))
  if (activeFilter.value === 'noLicense') list = list.filter(r => !r.license)
  return list
})

const isExpiredLic  = (lic: any) => lic?.expires_at && new Date(lic.expires_at) < new Date()
const daysLeft      = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
const formatDate    = (d: string) => d ? new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'

const getLicenseType = (lic: any) => {
  if (lic?.note) return lic.note
  if (!lic?.expires_at) return 'ไม่จำกัด'
  const days = Math.round((new Date(lic.expires_at).getTime() - new Date(lic.created_at || Date.now()).getTime()) / 86400000)
  return days >= 330 ? '1 ปี' : days >= 175 ? '6 เดือน' : `${days} วัน`
}

const getStatusText = (r: any) => !r.license ? 'No License' : isExpiredLic(r.license) ? 'Expired' : 'Active'

const showToast = (msg: string, type: 'success' | 'error') => {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { msg, type }
  toastTimer = setTimeout(() => { toast.value = null }, 3000)
}

const openGenModal = (row: any) => {
  const d = new Date(); d.setFullYear(d.getFullYear() + 1)
  genModal.value = { open: true, user: row, expiresAt: d.toISOString().slice(0, 10), note: '1 ปี', loading: false }
}
const onGenLicense = async () => {
  genModal.value.loading = true
  const { data, error } = await generateAndAssignLicense(genModal.value.user.id, genModal.value.expiresAt || null, genModal.value.note || null)
  if (error) showToast('เกิดข้อผิดพลาด: ' + (error as any).message, 'error')
  else { showToast(`สร้าง License สำเร็จ: ${data?.key}`, 'success'); genModal.value.open = false; await loadData() }
  genModal.value.loading = false
}

const openRenewModal = (row: any) => {
  const d = new Date(row.license?.expires_at || Date.now()); d.setFullYear(d.getFullYear() + 1)
  renewModal.value = { open: true, user: row, newExpiry: d.toISOString().slice(0, 10), loading: false }
}
const onRenew = async () => {
  renewModal.value.loading = true
  const { error } = await extendLicense(renewModal.value.user.license.id, renewModal.value.newExpiry)
  if (error) showToast('เกิดข้อผิดพลาด', 'error')
  else { showToast('ต่ออายุ License สำเร็จ', 'success'); renewModal.value.open = false; await loadData() }
  renewModal.value.loading = false
}

const openRevokeConfirm = (row: any) => { revokeTarget.value = row }
const onRevoke = async () => {
  if (!revokeTarget.value) return
  actionBusy.value = revokeTarget.value.id
  const { error } = await revokeUserLicense(revokeTarget.value.id, revokeTarget.value.license.id)
  if (error) showToast('เกิดข้อผิดพลาด', 'error')
  else { showToast(`ยกเลิก License ของ ${revokeTarget.value.full_name} แล้ว`, 'success'); revokeTarget.value = null; await loadData() }
  actionBusy.value = null
}

const onLogout = () => { signOut(); navigateTo('/login') }
onMounted(() => { initSession(); loadData() })
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
@keyframes spin { to { transform: rotate(360deg) } }

/* Root */
.admin-root {
  display: flex;
  min-height: 100vh;
  background: #F9FAFB;
  font-family: 'Inter', -apple-system, sans-serif;
  color: #0f172a;
}

/* Sidebar */
.sidebar {
  width: 232px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  box-shadow: 1px 0 0 #f3f4f6;
}
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid #f3f4f6;
}
.logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(124,58,237,.25);
}
.logo-title { margin: 0; font-size: 14px; font-weight: 700; color: #0f172a; line-height: 1.2; }
.logo-sub   { margin: 0; font-size: 10px; color: #94a3b8; font-weight: 500; }

.sidebar-nav { padding: 16px 12px; flex: 1; overflow-y: auto; }
.nav-section-label {
  font-size: 10px;
  font-weight: 700;
  color: #cbd5e1;
  letter-spacing: .08em;
  text-transform: uppercase;
  padding: 0 8px;
  margin: 0 0 6px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  text-decoration: none;
  transition: all .15s;
  margin-bottom: 2px;
}
.nav-item:hover { background: #f8fafc; color: #0f172a; }
.nav-item-active { background: #f5f3ff !important; color: #6d28d9 !important; font-weight: 600; }

.sidebar-footer {
  padding: 14px 16px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  gap: 10px;
}
.user-avatar {
  width: 32px; height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.user-info { flex: 1; min-width: 0; }
.user-name  { margin: 0; font-size: 12px; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-role  { margin: 0; font-size: 10px; color: #94a3b8; }
.logout-btn {
  width: 28px; height: 28px;
  border-radius: 7px;
  border: 1px solid #fecaca;
  background: #fff;
  color: #dc2626;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all .15s;
  flex-shrink: 0;
}
.logout-btn:hover { background: #fef2f2; }

/* Main */
.main-wrap { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow-x: hidden; }
.top-header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 18px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 10;
}
.page-title { margin: 0; font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: -.02em; }
.page-sub   { margin: 2px 0 0; font-size: 12px; color: #94a3b8; }

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 36px;
  padding: 0 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all .15s;
}
.refresh-btn:hover { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; }

.content-area { padding: 24px 28px; display: flex; flex-direction: column; gap: 20px; }

/* KPI */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
}
.kpi-card {
  background: #fff;
  border-radius: 12px;
  padding: 18px 20px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0,0,0,.05);
  display: flex;
  align-items: center;
  gap: 14px;
  transition: box-shadow .15s;
}
.kpi-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); }
.kpi-icon {
  width: 40px; height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.kpi-value { margin: 0 0 2px; font-size: 26px; font-weight: 800; letter-spacing: -.02em; line-height: 1; }
.kpi-label { margin: 0; font-size: 11px; font-weight: 600; color: #94a3b8; white-space: nowrap; }

/* Table Card */
.table-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0,0,0,.05);
  overflow: hidden;
}

/* Controls */
.table-controls {
  padding: 14px 20px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.filter-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #f8fafc;
  border-radius: 9px;
  padding: 3px;
  border: 1px solid #e5e7eb;
}
.filter-tab {
  height: 30px;
  padding: 0 14px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  background: transparent;
  color: #64748b;
  transition: all .15s;
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}
.filter-tab:hover { color: #0f172a; background: rgba(0,0,0,.04); }
.filter-tab-active { background: linear-gradient(135deg, #7c3aed, #4f46e5) !important; color: #fff !important; box-shadow: 0 2px 8px rgba(124,58,237,.25); }
.filter-count { font-size: 10px; opacity: .8; }

.search-wrap { position: relative; margin-left: auto; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
.search-input {
  height: 36px;
  width: 260px;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  padding: 0 12px 0 32px;
  font-size: 12px;
  outline: none;
  color: #0f172a;
  background: #fff;
  transition: all .2s;
  font-family: inherit;
}
.search-input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,.1); }

/* Table */
.loading-wrap { display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 14px; padding: 80px; }
.spinner { width: 32px; height: 32px; border-radius: 50%; border: 3px solid #e2e8f0; border-top-color: #7c3aed; animation: spin 1s linear infinite; }

.data-table { width: 100%; border-collapse: collapse; }
.data-table thead tr { background: #f8fafc; border-bottom: 1px solid #f1f5f9; }
.data-table thead th {
  padding: 11px 14px;
  text-align: left;
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: .08em;
  white-space: nowrap;
}
.table-row { border-bottom: 1px solid #f8fafc; transition: background .1s; }
.table-row:hover { background: #fafbff; }
.data-table tbody td { padding: 14px; }

/* Cell helpers */
.text-sm   { font-size: 12px; }
.text-muted { color: #64748b; margin: 0; }
.text-name { margin: 0; font-size: 13px; font-weight: 600; color: #0f172a; }
.text-org  { margin: 2px 0 0; font-size: 11px; color: #94a3b8; }
.text-days { margin: 3px 0 0; font-size: 11px; font-weight: 600; }
.days-red   { color: #ef4444; }
.days-amber { color: #f59e0b; }
.days-gray  { color: #94a3b8; }
.text-empty { color: #e2e8f0; font-size: 16px; }

.avatar {
  width: 34px; height: 34px;
  border-radius: 9px;
  background: linear-gradient(135deg, #ede9fe, #ddd6fe);
  color: #5b21b6;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.license-key {
  font-family: 'SF Mono', Consolas, monospace;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 7px;
  background: #f0fdfa;
  color: #0d9488;
  border: 1px solid #99f6e4;
  letter-spacing: .04em;
}
.copy-btn {
  width: 24px; height: 24px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all .15s;
}
.copy-btn:hover { background: #f8fafc; color: #475569; }

.badge-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 20px;
  padding: 0 7px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}
.badge-count-blue { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; }
.badge-count-gray { background: #f1f5f9; color: #94a3b8; border: 1px solid #e2e8f0; }

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}
.status-active  { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
.status-active .status-dot  { width: 6px; height: 6px; border-radius: 50%; background: #16a34a; box-shadow: 0 0 4px rgba(22,163,74,.5); flex-shrink: 0; }
.status-expired { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
.status-expired .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #d97706; flex-shrink: 0; }
.status-none    { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
.status-none .status-dot    { width: 6px; height: 6px; border-radius: 50%; background: #94a3b8; flex-shrink: 0; }

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 12px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s;
}
.action-gen    { background: linear-gradient(135deg,#7c3aed,#4f46e5); color: #fff; border: none; box-shadow: 0 2px 8px rgba(124,58,237,.25); }
.action-gen:hover { opacity: .85; transform: translateY(-1px); }
.action-renew  { background: #f0fdf4; color: #16a34a; border: 1.5px solid #bbf7d0; }
.action-renew:hover  { background: #dcfce7; }
.action-revoke { background: #fef2f2; color: #dc2626; border: 1.5px solid #fecaca; }
.action-revoke:hover { background: #fee2e2; }

.badge-you { font-size: 11px; color: #94a3b8; font-weight: 600; background: #f8fafc; padding: 4px 10px; border-radius: 6px; border: 1px solid #e2e8f0; }

.table-footer { padding: 12px 20px; border-top: 1px solid #f8fafc; background: #fafafa; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; z-index: 50;
  display: flex; align-items: center; justify-content: center;
  background: rgba(15,23,42,.45);
  backdrop-filter: blur(5px);
}
.modal-box {
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  width: 440px;
  max-width: 92vw;
  box-shadow: 0 24px 64px rgba(0,0,0,.18);
  border: 1px solid #e2e8f0;
}
.modal-header { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
.modal-icon { width: 42px; height: 42px; border-radius: 12px; border: 1px solid; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.modal-title { margin: 0; font-size: 16px; font-weight: 700; color: #0f172a; }
.modal-sub   { margin: 2px 0 0; font-size: 11px; color: #94a3b8; }

.field-label { display: block; font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 7px; text-transform: uppercase; letter-spacing: .07em; }
.field-input {
  width: 100%;
  height: 42px;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  padding: 0 13px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  color: #0f172a;
  background: #fff;
  transition: all .2s;
  font-family: inherit;
}
.field-input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,.1); }

.btn-cancel {
  flex: 1;
  height: 42px;
  border-radius: 9px;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  color: #475569;
  transition: all .15s;
  font-family: inherit;
}
.btn-cancel:hover { background: #f8fafc; }
.btn-primary {
  flex: 2;
  height: 42px;
  border-radius: 9px;
  border: none;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity .15s;
  font-family: inherit;
}
.btn-primary:hover { opacity: .88; }
.btn-primary:disabled { opacity: .65; cursor: not-allowed; }
.btn-spinner { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; animation: spin 1s linear infinite; flex-shrink: 0; }

/* Toast */
.toast {
  position: fixed; bottom: 24px; right: 24px; z-index: 60;
  padding: 12px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,.15);
}
.toast-success { background: linear-gradient(135deg, #22c55e, #16a34a); }
.toast-error   { background: linear-gradient(135deg, #ef4444, #dc2626); }

/* Transitions */
.modal-enter-active, .modal-leave-active { transition: opacity .2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.toast-enter-active, .toast-leave-active { transition: all .3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(8px); }

@media (max-width: 768px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .sidebar { display: none; }
  .search-input { width: 200px; }
}
</style>
