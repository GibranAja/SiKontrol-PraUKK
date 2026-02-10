# 📋 CHECKLIST TESTING BACKEND API - Sistem Peminjaman Alat

## ✅ Database & Schema
- [✓] Database connected (MySQL @ 127.0.0.1:3306)
- [✓] Tables created (prisma db push)
- [✓] Data seeded successfully
  - [✓] Admin user: `admin` / `Admin123`
  - [✓] Petugas users: `petugas1`, `petugas2`
  - [✓] 5 Peminjam users
  - [✓] 3 Kategori

## 🔐 1. AUTHENTICATION ENDPOINTS

### POST /api/auth/register
- [ ] Create new user
- [ ] Validate input (username, password, nama_lengkap, kelas, jenis_kelamin)
- [ ] Hash password with bcrypt
- [ ] Return success response

### POST /api/auth/login
- [ ] Login with username & password
- [ ] Return accessToken & refreshToken
- [ ] Token expires in 15 minutes
- [ ] Log activity to database

### POST /api/auth/refresh
- [ ] Refresh expired accessToken
- [ ] Validate refreshToken
- [ ] Return new accessToken

### POST /api/auth/logout
- [ ] Revoke refreshToken
- [ ] Clear user session

---

## 👥 2. USER MANAGEMENT

### GET /api/users
- [ ] Get all users (admin/petugas only)
- [ ] Pagination support
- [ ] Filter by role, status_akun
- [ ] Search by nama/username

### GET /api/users/:id
- [ ] Get user by ID
- [ ] Include related data

### GET /api/users/profile
- [ ] Get current user profile
- [ ] Protected route (auth required)

### PATCH /api/users/:id
- [ ] Update user data (admin only)
- [ ] Validate input

### PATCH /api/users/:id/status
- [ ] Change user status (AKTIF/DIBLOKIR/NONAKTIF)
- [ ] Admin/Petugas

### PATCH /api/users/change-password
- [ ] Change own password
- [ ] Validate old password
- [ ] Hash new password

### DELETE /api/users/:id
- [ ] Soft delete user
- [ ] Set deleted_at timestamp

---

## 📂 3. KATEGORI MANAGEMENT

### POST /api/kategori
- [ ] Create kategori (admin/petugas)
- [ ] Validate nama_kategori, deskripsi

### GET /api/kategori
- [ ] Get all kategori
- [ ] Exclude soft deleted
- [ ] Public access

### GET /api/kategori/:id
- [ ] Get kategori by ID
- [ ] Include related alat count

### PATCH /api/kategori/:id
- [ ] Update kategori
- [ ] Admin/petugas only

### DELETE /api/kategori/:id
- [ ] Soft delete kategori
- [ ] Check if has active alat

---

## 🔧 4. ALAT MANAGEMENT

### POST /api/alat
- [ ] Create alat (admin/petugas)
- [ ] Validate fields: nama_alat, kode_alat, id_kategori, stok, kondisi
- [ ] Upload gambar (optional)
- [ ] Unique kode_alat

### GET /api/alat
- [ ] Get all alat
- [ ] Filter by kategori, kondisi
- [ ] Search by nama, kode
- [ ] Pagination

### GET /api/alat/:id
- [ ] Get alat detail
- [ ] Include kategori info
- [ ] Show stok tersedia

### PATCH /api/alat/:id
- [ ] Update alat data
- [ ] Admin/petugas only

### PATCH /api/alat/:id/kondisi
- [ ] Update kondisi alat
- [ ] Log activity

### DELETE /api/alat/:id
- [ ] Soft delete alat
- [ ] Check if in active peminjaman

---

## 📦 5. PEMINJAMAN

### POST /api/peminjaman
- [ ] Create peminjaman request
- [ ] Validate user eligibility:
  - Not DIBLOKIR
  - Max 2 active peminjaman
  - No overdue loans
- [ ] Generate unique kode_peminjaman
- [ ] Status: MENUNGGU_PERSETUJUAN

### GET /api/peminjaman
- [ ] Get all peminjaman
- [ ] Filter by status, user, tanggal
- [ ] Admin/Petugas see all, User see own

### GET /api/peminjaman/:id
- [ ] Get peminjaman detail
- [ ] Include user, alat, perpanjangan, pengembalian

### POST /api/peminjaman/:id/verify
- [ ] Approve/Reject peminjaman (admin/petugas)
- [ ] If approved: set tanggal_pinjam, tanggal_harus_kembali, reduce stok
- [ ] If rejected: set alasan_ditolak
- [ ] Log activity

### PATCH /api/peminjaman/:id/cancel
- [ ] Cancel own peminjaman
- [ ] Only if status = MENUNGGU_PERSETUJUAN

---

## ⏰ 6. PERPANJANGAN

### POST /api/perpanjangan
- [ ] Request perpanjangan
- [ ] Validate:
  - Peminjaman status = DIPINJAM
  - Max 7 days extension
  - Request min 3 days before due
  - Max 2 perpanjangan per peminjaman
- [ ] Status: MENUNGGU

### GET /api/perpanjangan
- [ ] Get all perpanjangan
- [ ] Filter by status, peminjaman

### GET /api/perpanjangan/:id
- [ ] Get perpanjangan detail

### POST /api/perpanjangan/:id/verify
- [ ] Approve/Reject perpanjangan (admin/petugas)
- [ ] If approved: extend tanggal_harus_kembali
- [ ] Log activity

---

## 📥 7. PENGEMBALIAN

### POST /api/pengembalian
- [ ] Process pengembalian (admin/petugas)
- [ ] Calculate denda:
  - Late return: Rp 5,000/day
  - RUSAK_RINGAN: +Rp 20,000
  - RUSAK_BERAT: +Rp 50,000
  - HILANG: full harga alat
- [ ] Update alat condition if worse
- [ ] Restore stok
- [ ] Set peminjaman status = DIKEMBALIKAN

### GET /api/pengembalian
- [ ] Get all pengembalian
- [ ] Filter by status_denda, tanggal

### GET /api/pengembalian/:id
- [ ] Get pengembalian detail

### PATCH /api/pengembalian/:id/bayar-denda
- [ ] Mark denda as LUNAS
- [ ] Admin/petugas only

---

## 📜 8. LOG AKTIVITAS

### GET /api/log-aktivitas
- [ ] Get activity logs
- [ ] Filter by user, date range, aktivitas
- [ ] Pagination
- [ ] Admin only

---

## 📊 9. LAPORAN

### GET /api/laporan/dashboard
- [ ] Get dashboard statistics:
  - Total users (by role)
  - Total alat (by kondisi)
  - Total peminjaman (by status)
  - Pending perpanjangan
  - Unpaid denda
  - Overdue loans
- [ ] Admin/petugas only

### GET /api/laporan/peminjaman
- [ ] Peminjaman report by date range
- [ ] Filter by status, user, alat
- [ ] Export-ready format

### GET /api/laporan/denda
- [ ] Denda report by date range
- [ ] Group by status_denda
- [ ] Total denda calculation

### GET /api/laporan/alat-terbanyak
- [ ] Top borrowed alat report
- [ ] Filter by periode (month/year/all)
- [ ] Limit top N

---

## 🔒 10. MIDDLEWARE & UTILS

### Authentication Middleware
- [ ] Verify JWT token
- [ ] Attach user to event.context
- [ ] Handle expired tokens

### Authorization Middleware
- [ ] Check user role (ADMIN/PETUGAS/PEMINJAM)
- [ ] Route-specific permissions

### Rate Limiting
- [ ] Auth endpoints: 5 req / 15 min
- [ ] API endpoints: 100 req / 1 min
- [ ] Return 429 when exceeded

### Validation (Zod)
- [ ] Request body validation
- [ ] Query params validation
- [ ] Type-safe schemas

### Error Handling
- [ ] Standardized error responses
- [ ] HTTP status codes
- [ ] Error logging

---

## 🤖 11. SCHEDULED TASKS

### Task: Auto Blacklist
- [ ] Runs daily at 00:00
- [ ] Block users with loans overdue > 14 days
- [ ] Log blocked users
- [ ] Send notifications (if configured)

---

## 🛠️ UTILITIES

### Prisma Client
- [ ] Singleton instance
- [ ] Soft delete extension
- [ ] Connection pooling

### JWT Utils
- [ ] Generate access & refresh tokens
- [ ] Verify tokens
- [ ] Token expiration handling

### Helpers
- [ ] formatResponse()
- [ ] formatErrorResponse()
- [ ] generateKodePeminjaman()
- [ ] calculateDenda()
- [ ] escapeHtml()
- [ ] getClientIp()

### Logger
- [ ] Activity logging
- [ ] Request/response logging
- [ ] Error logging
- [ ] Color-coded console output

---

## ✅ TESTING READY ENDPOINTS

**Data Tersedia dari Seed:**
- ✅ Admin: username=`admin`, password=`Admin123`
- ✅ Petugas: username=`petugas1`, password=`Petugas123`
- ✅ Peminjam: username=`peminjam1`, password=`Peminjam123`
- ✅ 3 Kategori (Elektronik, Olahraga, Komputer)
- ✅ Alat will be created after kategori

**Cara Test Manual:**
1. Login sebagai admin
2. Create Kategori
3. Create Alat
4. Login sebagai peminjam
5. Buat peminjaman
6. Login sebagai petugas/admin
7. Approve peminjaman
8. Test perpanjangan
9. Test pengembalian
10. Check laporan

**Endpoint yang Perlu Database Connection:**
- ✅ Database connected
- ✅ Server running on http://localhost:3000
- ✅ No compilation errors
- ⚠️ Manual testing recommended via:
  - Postman
  - Thunder Client (VS Code)
  - cURL
  - Browser (GET requests)

---

## 📝 NOTES

- All timestamps in ISO 8601 format
- Soft delete implemented for Users, Kategori, Alat
- JWT expires: Access (15m), Refresh (7d)
- Default loan duration: 7 days
- Max concurrent loans per user: 2
- Max extension days: 7
- Denda auto-calculated on return
- Activity logs auto-created for sensitive actions
