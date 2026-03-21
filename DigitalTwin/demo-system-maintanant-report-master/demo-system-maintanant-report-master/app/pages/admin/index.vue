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
        <NuxtLink to="/"
          style="display:flex;align-items:center;gap:6px;font-size:13px;color:#475569;padding:8px 16px;border-radius:9px;text-decoration:none;font-weight:500;border:1px solid #e2e8f0;background:#fff;transition:all .15s"
          onmouseover="this.style.background='#f8fafc';this.style.borderColor='#cbd5e1';this.style.color='#0f172a'"
          onmouseout="this.style.background='#fff';this.style.borderColor='#e2e8f0';this.style.color='#475569'">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          หน้าหลัก
        </NuxtLink>
        <div style="width:1px;height:28px;background:#e2e8f0;margin:0 2px"></div>
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
          <h1 style="margin:0;font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-.02em">จัดการผู้ใช้งาน</h1>
          <p style="margin:4px 0 0;font-size:13px;color:#94a3b8">ดูแลและจัดการ License สำหรับผู้ใช้ทั้งหมดในระบบ</p>
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

      <!-- ── Stat Cards ── -->
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:16px">

        <!-- Total Users -->
        <div style="background:#fff;border-radius:16px;padding:22px;border:1px solid #e2e8f0;box-shadow:0 2px 8px rgba(0,0,0,.05);position:relative;overflow:hidden">
          <div style="position:absolute;right:-16px;top:-16px;width:80px;height:80px;border-radius:50%;background:#f8fafc"></div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
            <p style="margin:0;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em">ผู้ใช้ลงทะเบียน</p>
            <div style="width:36px;height:36px;border-radius:10px;background:#f1f5f9;display:flex;align-items:center;justify-content:center">
              <svg width="17" height="17" fill="none" stroke="#64748b" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
          </div>
          <p style="margin:0 0 4px;font-size:38px;font-weight:800;color:#0f172a;letter-spacing:-.03em;line-height:1">{{ stats.total }}</p>
          <p style="margin:0;font-size:12px;color:#94a3b8;font-weight:500">คนทั้งหมด</p>
        </div>

        <!-- Active License -->
        <div style="background:#fff;border-radius:16px;padding:22px;border:1px solid #e2e8f0;border-left:4px solid #22c55e;box-shadow:0 2px 8px rgba(0,0,0,.05);position:relative;overflow:hidden">
          <div style="position:absolute;right:-16px;top:-16px;width:80px;height:80px;border-radius:50%;background:#f0fdf4"></div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
            <p style="margin:0;font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:.08em">License ใช้งาน</p>
            <div style="width:36px;height:36px;border-radius:10px;background:#f0fdf4;display:flex;align-items:center;justify-content:center">
              <svg width="17" height="17" fill="none" stroke="#16a34a" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
          </div>
          <p style="margin:0 0 4px;font-size:38px;font-weight:800;color:#16a34a;letter-spacing:-.03em;line-height:1">{{ stats.active }}</p>
          <p style="margin:0;font-size:12px;color:#86efac;font-weight:500">ใช้งานอยู่</p>
        </div>

        <!-- Expired -->
        <div style="background:#fff;border-radius:16px;padding:22px;border:1px solid #e2e8f0;border-left:4px solid #f59e0b;box-shadow:0 2px 8px rgba(0,0,0,.05);position:relative;overflow:hidden">
          <div style="position:absolute;right:-16px;top:-16px;width:80px;height:80px;border-radius:50%;background:#fffbeb"></div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
            <p style="margin:0;font-size:11px;font-weight:700;color:#d97706;text-transform:uppercase;letter-spacing:.08em">License หมดอายุ</p>
            <div style="width:36px;height:36px;border-radius:10px;background:#fffbeb;display:flex;align-items:center;justify-content:center">
              <svg width="17" height="17" fill="none" stroke="#d97706" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
          </div>
          <p style="margin:0 0 4px;font-size:38px;font-weight:800;color:#d97706;letter-spacing:-.03em;line-height:1">{{ stats.expired }}</p>
          <p style="margin:0;font-size:12px;color:#fcd34d;font-weight:500">หมดอายุแล้ว</p>
        </div>

        <!-- No License -->
        <div style="background:#fff;border-radius:16px;padding:22px;border:1px solid #e2e8f0;border-left:4px solid #f87171;box-shadow:0 2px 8px rgba(0,0,0,.05);position:relative;overflow:hidden">
          <div style="position:absolute;right:-16px;top:-16px;width:80px;height:80px;border-radius:50%;background:#fef2f2"></div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
            <p style="margin:0;font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:.08em">ไม่มี License</p>
            <div style="width:36px;height:36px;border-radius:10px;background:#fef2f2;display:flex;align-items:center;justify-content:center">
              <svg width="17" height="17" fill="none" stroke="#dc2626" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
            </div>
          </div>
          <p style="margin:0 0 4px;font-size:38px;font-weight:800;color:#dc2626;letter-spacing:-.03em;line-height:1">{{ stats.noLicense }}</p>
          <p style="margin:0;font-size:12px;color:#fca5a5;font-weight:500">ยังไม่มี</p>
        </div>

        <!-- Total Projects -->
        <div style="background:#fff;border-radius:16px;padding:22px;border:1px solid #e2e8f0;border-left:4px solid #3b82f6;box-shadow:0 2px 8px rgba(0,0,0,.05);position:relative;overflow:hidden">
          <div style="position:absolute;right:-16px;top:-16px;width:80px;height:80px;border-radius:50%;background:#eff6ff"></div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
            <p style="margin:0;font-size:11px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:.08em">โปรเจครวม</p>
            <div style="width:36px;height:36px;border-radius:10px;background:#eff6ff;display:flex;align-items:center;justify-content:center">
              <svg width="17" height="17" fill="none" stroke="#2563eb" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
            </div>
          </div>
          <p style="margin:0 0 4px;font-size:38px;font-weight:800;color:#2563eb;letter-spacing:-.03em;line-height:1">{{ stats.projects }}</p>
          <p style="margin:0;font-size:12px;color:#93c5fd;font-weight:500">โปรเจคทั้งหมด</p>
        </div>

      </div>

      <!-- ── Table Card ── -->
      <div style="background:#fff;border-radius:20px;border:1px solid #e2e8f0;box-shadow:0 2px 12px rgba(0,0,0,.06);overflow:hidden;display:flex;flex-direction:column;flex:1">

        <!-- Table Header Controls -->
        <div style="padding:16px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px">
          <div style="display:flex;align-items:center;gap:4px;background:#f1f5f9;border-radius:12px;padding:4px;border:1px solid #e2e8f0">
            <button v-for="f in filters" :key="f.key" @click="activeFilter = f.key"
              style="height:32px;padding:0 16px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;border:none;transition:all .2s;white-space:nowrap"
              :style="activeFilter === f.key
                ? 'background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;box-shadow:0 2px 8px rgba(124,58,237,.3)'
                : 'background:transparent;color:#64748b'">
              {{ f.label }}
              <span v-if="f.key !== 'all'" style="margin-left:5px;font-size:10px;opacity:.75">({{ getFilterCount(f.key) }})</span>
            </button>
          </div>

          <div style="flex:1"></div>

          <!-- Search -->
          <div style="position:relative">
            <svg style="position:absolute;left:11px;top:50%;transform:translateY(-50%);pointer-events:none" width="13" height="13" fill="none" stroke="#94a3b8" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="m21 21-4.35-4.35"/>
            </svg>
            <input v-model="search" type="text" placeholder="ค้นหาชื่อ, อีเมล, License Key..."
              style="height:38px;width:280px;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 12px 0 34px;font-size:12px;outline:none;color:#0f172a;background:#fff;transition:all .2s"
              @focus="($event.target as HTMLInputElement).style.borderColor='#7c3aed';($event.target as HTMLInputElement).style.boxShadow='0 0 0 3px rgba(124,58,237,.1)'"
              @blur="($event.target as HTMLInputElement).style.borderColor='#e2e8f0';($event.target as HTMLInputElement).style.boxShadow='none'"/>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;padding:80px">
          <div style="width:36px;height:36px;border-radius:50%;border:3px solid #e2e8f0;border-top-color:#7c3aed;animation:spin 1s linear infinite"></div>
          <p style="font-size:13px;color:#94a3b8;margin:0;font-weight:500">กำลังโหลดข้อมูล...</p>
        </div>

        <!-- Table -->
        <div v-else style="overflow-x:auto;flex:1">
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#f8fafc;border-bottom:1px solid #f1f5f9">
                <th style="padding:12px 14px 12px 24px;text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em;white-space:nowrap;width:52px">#</th>
                <th style="padding:12px 14px;text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em;white-space:nowrap">วันที่สมัคร</th>
                <th style="padding:12px 14px;text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em">ชื่อ / หน่วยงาน</th>
                <th style="padding:12px 14px;text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em">อีเมล</th>
                <th style="padding:12px 14px;text-align:center;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em">โปรเจค</th>
                <th style="padding:12px 14px;text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em">LICENSE KEY</th>
                <th style="padding:12px 14px;text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em">ประเภท</th>
                <th style="padding:12px 14px;text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em;white-space:nowrap">วันหมดอายุ</th>
                <th style="padding:12px 14px;text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em">สถานะ</th>
                <th style="padding:12px 24px 12px 14px;text-align:right;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredRows.length === 0">
                <td colspan="10" style="padding:80px;text-align:center">
                  <div style="display:flex;flex-direction:column;align-items:center;gap:12px">
                    <div style="width:56px;height:56px;border-radius:16px;background:#f8fafc;display:flex;align-items:center;justify-content:center;border:1px solid #e2e8f0">
                      <svg width="26" height="26" fill="none" stroke="#cbd5e1" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
                    </div>
                    <p style="font-size:14px;color:#475569;margin:0;font-weight:600">ไม่พบข้อมูล</p>
                    <p style="font-size:12px;color:#94a3b8;margin:0">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
                  </div>
                </td>
              </tr>
              <tr v-for="(row, idx) in filteredRows" :key="row.id"
                  style="border-bottom:1px solid #f8fafc;transition:background .12s"
                  @mouseover="($event.currentTarget as HTMLElement).style.background='#fafbff'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background=''">

                <!-- # -->
                <td style="padding:16px 14px 16px 24px;white-space:nowrap">
                  <div style="display:flex;align-items:center;gap:5px">
                    <span style="font-size:12px;color:#cbd5e1;font-weight:700;font-variant-numeric:tabular-nums">{{ String(idx+1).padStart(2,'0') }}</span>
                    <span v-if="row.role === 'super_admin'" title="Super Admin" style="font-size:11px;color:#f59e0b">★</span>
                  </div>
                </td>

                <!-- วันที่ -->
                <td style="padding:16px 14px;white-space:nowrap">
                  <p style="margin:0;font-size:12px;color:#64748b;font-weight:500">{{ formatDate(row.created_at) }}</p>
                </td>

                <!-- ชื่อ -->
                <td style="padding:16px 14px;white-space:nowrap">
                  <div style="display:flex;align-items:center;gap:11px">
                    <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#ede9fe,#ddd6fe);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#5b21b6;flex-shrink:0">
                      {{ row.full_name?.charAt(0)?.toUpperCase() || '?' }}
                    </div>
                    <div>
                      <p style="margin:0;font-size:13px;font-weight:600;color:#0f172a">{{ row.full_name }}</p>
                      <p v-if="row.organization" style="margin:2px 0 0;font-size:11px;color:#94a3b8">{{ row.organization }}</p>
                    </div>
                  </div>
                </td>

                <!-- อีเมล -->
                <td style="padding:16px 14px;white-space:nowrap">
                  <p style="margin:0;font-size:12px;color:#64748b">{{ row.email }}</p>
                </td>

                <!-- โปรเจค -->
                <td style="padding:16px 14px;text-align:center">
                  <span style="display:inline-flex;align-items:center;justify-content:center;min-width:26px;height:22px;padding:0 8px;border-radius:20px;font-size:11px;font-weight:700"
                    :style="row.project_count > 0 ? 'background:#dbeafe;color:#1d4ed8;border:1px solid #bfdbfe' : 'background:#f1f5f9;color:#94a3b8;border:1px solid #e2e8f0'">
                    {{ row.project_count }}
                  </span>
                </td>

                <!-- LICENSE KEY -->
                <td style="padding:16px 14px">
                  <span v-if="row.license"
                    style="font-family:'SF Mono',Consolas,monospace;font-size:11px;font-weight:600;padding:5px 11px;border-radius:8px;background:#f0fdfa;color:#0d9488;border:1px solid #99f6e4;white-space:nowrap;letter-spacing:.05em">
                    {{ row.license.key }}
                  </span>
                  <span v-else style="color:#e2e8f0;font-size:16px">—</span>
                </td>

                <!-- ประเภท -->
                <td style="padding:16px 14px;white-space:nowrap">
                  <span v-if="row.license" style="font-size:12px;color:#475569;font-weight:500">{{ getLicenseType(row.license) }}</span>
                  <span v-else style="color:#e2e8f0;font-size:16px">—</span>
                </td>

                <!-- วันหมดอายุ -->
                <td style="padding:16px 14px;white-space:nowrap">
                  <template v-if="row.license?.expires_at">
                    <p style="margin:0;font-size:12px;color:#334155;font-weight:500">{{ formatDate(row.license.expires_at) }}</p>
                    <p style="margin:3px 0 0;font-size:11px;font-weight:600"
                      :style="daysLeft(row.license.expires_at) <= 30 ? 'color:#ef4444' : daysLeft(row.license.expires_at) <= 90 ? 'color:#f59e0b' : 'color:#94a3b8'">
                      เหลือ {{ daysLeft(row.license.expires_at) }} วัน
                    </p>
                  </template>
                  <span v-else style="color:#e2e8f0;font-size:16px">—</span>
                </td>

                <!-- สถานะ -->
                <td style="padding:16px 14px">
                  <div style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:700" :style="getStatusStyle(row)">
                    <span style="width:6px;height:6px;border-radius:50%;flex-shrink:0" :style="getStatusDotStyle(row)"></span>
                    <span style="white-space:nowrap">{{ getStatusText(row) }}</span>
                  </div>
                </td>

                <!-- Actions -->
                <td style="padding:16px 24px 16px 14px;text-align:right">
                  <div v-if="row.id !== user?.id" style="display:inline-flex;align-items:center;gap:6px">
                    <button v-if="!row.license" @click="openGenModal(row)"
                      style="height:32px;padding:0 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;border:none;box-shadow:0 2px 8px rgba(14,165,233,.3);transition:all .15s"
                      onmouseover="this.style.opacity='.85';this.style.transform='translateY(-1px)'"
                      onmouseout="this.style.opacity='1';this.style.transform='translateY(0)'">
                      + Gen License
                    </button>
                    <template v-else>
                      <button @click="openRenewModal(row)" :disabled="actionBusy === row.id"
                        style="height:32px;padding:0 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid #bbf7d0;background:#f0fdf4;color:#16a34a;transition:all .15s"
                        onmouseover="this.style.background='#dcfce7';this.style.borderColor='#86efac'"
                        onmouseout="this.style.background='#f0fdf4';this.style.borderColor='#bbf7d0'">
                        + ต่ออายุ
                      </button>
                      <button @click="openRevokeConfirm(row)" :disabled="actionBusy === row.id"
                        style="height:32px;padding:0 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid #fecaca;background:#fef2f2;color:#dc2626;transition:all .15s"
                        onmouseover="this.style.background='#fee2e2';this.style.borderColor='#fca5a5'"
                        onmouseout="this.style.background='#fef2f2';this.style.borderColor='#fecaca'">
                        × ยกเลิก
                      </button>
                    </template>
                  </div>
                  <span v-else style="font-size:11px;color:#94a3b8;font-weight:600;background:#f8fafc;padding:4px 10px;border-radius:6px;border:1px solid #e2e8f0">(คุณ)</span>
                </td>
              </tr>
            </tbody>
          </table>

          <div style="padding:14px 24px;border-top:1px solid #f8fafc;display:flex;align-items:center;justify-content:space-between;background:#fafafa">
            <p style="margin:0;font-size:12px;color:#94a3b8">
              แสดง <strong style="color:#475569">{{ filteredRows.length }}</strong> จาก <strong style="color:#475569">{{ rows.length }}</strong> ผู้ใช้
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Modal: Gen License ── -->
    <Transition name="modal">
      <div v-if="genModal.open" style="position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.5);backdrop-filter:blur(6px)" @click.self="genModal.open=false">
        <div style="background:#fff;border-radius:20px;padding:32px;width:460px;max-width:92vw;box-shadow:0 32px 80px rgba(0,0,0,.2);border:1px solid #e2e8f0">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px">
            <div style="width:44px;height:44px;border-radius:14px;background:#eff6ff;border:1px solid #bfdbfe;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="22" height="22" fill="none" stroke="#2563eb" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
            </div>
            <div>
              <h3 style="margin:0;font-size:17px;font-weight:700;color:#0f172a">สร้าง License Key</h3>
              <p style="margin:2px 0 0;font-size:12px;color:#94a3b8">{{ genModal.user?.full_name }} · {{ genModal.user?.email }}</p>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:16px;margin-bottom:24px">
            <div>
              <label style="display:block;font-size:11px;font-weight:700;color:#64748b;margin-bottom:8px;text-transform:uppercase;letter-spacing:.07em">วันหมดอายุ</label>
              <input v-model="genModal.expiresAt" type="date"
                style="width:100%;height:44px;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 14px;font-size:13px;outline:none;box-sizing:border-box;color:#0f172a;background:#fff;transition:all .2s"
                @focus="($event.target as HTMLInputElement).style.borderColor='#7c3aed';($event.target as HTMLInputElement).style.boxShadow='0 0 0 3px rgba(124,58,237,.1)'"
                @blur="($event.target as HTMLInputElement).style.borderColor='#e2e8f0';($event.target as HTMLInputElement).style.boxShadow='none'"/>
            </div>
            <div>
              <label style="display:block;font-size:11px;font-weight:700;color:#64748b;margin-bottom:8px;text-transform:uppercase;letter-spacing:.07em">ประเภท / หมายเหตุ</label>
              <input v-model="genModal.note" type="text" placeholder="เช่น 1 ปี, 1 ปี (5 users)"
                style="width:100%;height:44px;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 14px;font-size:13px;outline:none;box-sizing:border-box;color:#0f172a;background:#fff;transition:all .2s"
                @focus="($event.target as HTMLInputElement).style.borderColor='#7c3aed';($event.target as HTMLInputElement).style.boxShadow='0 0 0 3px rgba(124,58,237,.1)'"
                @blur="($event.target as HTMLInputElement).style.borderColor='#e2e8f0';($event.target as HTMLInputElement).style.boxShadow='none'"/>
            </div>
          </div>
          <div style="display:flex;gap:10px">
            <button @click="genModal.open=false" style="flex:1;height:44px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;font-size:13px;font-weight:600;cursor:pointer;color:#475569;transition:all .15s"
              onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">ยกเลิก</button>
            <button @click="onGenLicense" :disabled="genModal.loading"
              style="flex:2;height:44px;border-radius:10px;border:none;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 16px rgba(14,165,233,.35);transition:opacity .15s">
              <span v-if="genModal.loading" style="width:15px;height:15px;border-radius:50%;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;animation:spin 1s linear infinite;flex-shrink:0"></span>
              {{ genModal.loading ? 'กำลังสร้าง...' : '+ สร้าง License Key' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Modal: Renew ── -->
    <Transition name="modal">
      <div v-if="renewModal.open" style="position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.5);backdrop-filter:blur(6px)" @click.self="renewModal.open=false">
        <div style="background:#fff;border-radius:20px;padding:32px;width:420px;max-width:92vw;box-shadow:0 32px 80px rgba(0,0,0,.2);border:1px solid #e2e8f0">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px">
            <div style="width:44px;height:44px;border-radius:14px;background:#f0fdf4;border:1px solid #bbf7d0;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="22" height="22" fill="none" stroke="#16a34a" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </div>
            <div>
              <h3 style="margin:0;font-size:17px;font-weight:700;color:#0f172a">ต่ออายุ License</h3>
              <p style="margin:2px 0 0;font-size:12px;color:#94a3b8">{{ renewModal.user?.full_name }}</p>
            </div>
          </div>
          <div style="margin-bottom:24px">
            <label style="display:block;font-size:11px;font-weight:700;color:#64748b;margin-bottom:8px;text-transform:uppercase;letter-spacing:.07em">วันหมดอายุใหม่</label>
            <input v-model="renewModal.newExpiry" type="date"
              style="width:100%;height:44px;border:1.5px solid #e2e8f0;border-radius:10px;padding:0 14px;font-size:13px;outline:none;box-sizing:border-box;color:#0f172a;background:#fff;transition:all .2s"
              @focus="($event.target as HTMLInputElement).style.borderColor='#16a34a';($event.target as HTMLInputElement).style.boxShadow='0 0 0 3px rgba(22,163,74,.1)'"
              @blur="($event.target as HTMLInputElement).style.borderColor='#e2e8f0';($event.target as HTMLInputElement).style.boxShadow='none'"/>
          </div>
          <div style="display:flex;gap:10px">
            <button @click="renewModal.open=false" style="flex:1;height:44px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;font-size:13px;font-weight:600;cursor:pointer;color:#475569;transition:all .15s"
              onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">ยกเลิก</button>
            <button @click="onRenew" :disabled="renewModal.loading||!renewModal.newExpiry"
              style="flex:2;height:44px;border-radius:10px;border:none;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 16px rgba(34,197,94,.35);transition:opacity .15s">
              <span v-if="renewModal.loading" style="width:15px;height:15px;border-radius:50%;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;animation:spin 1s linear infinite;flex-shrink:0"></span>
              {{ renewModal.loading ? 'กำลังบันทึก...' : '+ ต่ออายุ License' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Modal: Revoke ── -->
    <Transition name="modal">
      <div v-if="revokeTarget" style="position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.5);backdrop-filter:blur(6px)" @click.self="revokeTarget=null">
        <div style="background:#fff;border-radius:20px;padding:36px;width:400px;max-width:92vw;box-shadow:0 32px 80px rgba(0,0,0,.2);border:1px solid #fecaca;text-align:center">
          <div style="width:60px;height:60px;border-radius:50%;background:#fef2f2;border:1.5px solid #fecaca;display:flex;align-items:center;justify-content:center;margin:0 auto 18px">
            <svg width="28" height="28" fill="none" stroke="#dc2626" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <h3 style="margin:0 0 10px;font-size:18px;font-weight:700;color:#0f172a">ยืนยันการยกเลิก License</h3>
          <p style="margin:0 0 28px;font-size:13px;color:#64748b;line-height:1.7">
            คุณกำลังจะยกเลิก License ของ <strong style="color:#0f172a">{{ revokeTarget.full_name }}</strong><br/>บัญชีจะถูกปิดการใช้งานทันที
          </p>
          <div style="display:flex;gap:10px">
            <button @click="revokeTarget=null" style="flex:1;height:44px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;font-size:13px;font-weight:600;cursor:pointer;color:#475569;transition:all .15s"
              onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">ยกเลิก</button>
            <button @click="onRevoke" :disabled="actionBusy===revokeTarget?.id"
              style="flex:1;height:44px;border-radius:10px;border:none;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(220,38,38,.35);transition:opacity .15s">
              ยืนยัน
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Toast ── -->
    <Transition name="toast">
      <div v-if="toast"
        style="position:fixed;bottom:28px;right:28px;z-index:60;padding:14px 18px;border-radius:14px;font-size:13px;font-weight:600;color:#fff;display:flex;align-items:center;gap:10px;box-shadow:0 12px 32px rgba(0,0,0,.15)"
        :style="toast.type==='success' ? 'background:linear-gradient(135deg,#22c55e,#16a34a)' : 'background:linear-gradient(135deg,#ef4444,#dc2626)'">
        <div style="width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg v-if="toast.type==='success'" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          <svg v-else width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </div>
        {{ toast.msg }}
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'empty' })
useHead({ title: 'Admin | MapBeta' })

const { user, signOut, initSession, getAllUsersWithLicenses, generateAndAssignLicense, extendLicense, revokeUserLicense } = useCustomAuth()

const rows        = ref<any[]>([])
const loading     = ref(false)
const search      = ref('')
const activeFilter = ref('all')
const actionBusy  = ref<string | null>(null)
const revokeTarget = ref<any>(null)
const toast       = ref<{ msg: string; type: string } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

const filters = [
  { key: 'all',       label: 'ทั้งหมด' },
  { key: 'active',    label: 'ใช้งานได้' },
  { key: 'expired',   label: 'หมดอายุ' },
  { key: 'noLicense', label: 'ไม่มี License' },
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

const getStatusText     = (r: any) => !r.license ? 'ไม่มี License' : isExpiredLic(r.license) ? 'หมดอายุ' : 'ใช้งานได้'
const getStatusStyle    = (r: any) => !r.license ? 'background:#fef2f2;color:#dc2626;border:1px solid #fecaca' : isExpiredLic(r.license) ? 'background:#fffbeb;color:#d97706;border:1px solid #fde68a' : 'background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0'
const getStatusDotStyle = (r: any) => !r.license ? 'background:#dc2626' : isExpiredLic(r.license) ? 'background:#d97706' : 'background:#16a34a;box-shadow:0 0 5px rgba(22,163,74,.5)'

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
@keyframes spin { to { transform: rotate(360deg) } }
.modal-enter-active, .modal-leave-active { transition: opacity .2s }
.modal-enter-from, .modal-leave-to { opacity: 0 }
.toast-enter-active, .toast-leave-active { transition: all .3s }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(10px) }
</style>
