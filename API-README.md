# 🎯 COMPLETE API DOCUMENTATION

Semua endpoint backend telah berhasil dibuat dan siap untuk testing!

---

## 📚 Documentation Files

### 1. **API-TESTING-GUIDE.md** ⭐ MAIN GUIDE
**File lengkap dengan:**
- ✅ Semua 40 endpoints
- ✅ Request body examples untuk POST/PATCH
- ✅ Query parameters untuk GET
- ✅ Response success examples
- ✅ Error responses
- ✅ Field validation rules
- ✅ Business logic rules
- ✅ Testing sequence recommendations

**Buka file ini untuk detail lengkap setiap endpoint!**

---

### 2. **thunder-collection.json** ⚡ IMPORT KE THUNDER CLIENT
**Thunder Client Collection siap pakai:**
- 60+ pre-configured requests
- Organized by modules
- Environment variables setup
- Auto token extraction from login

**Cara pakai:**
1. Install Thunder Client extension di VS Code
2. Open Thunder Client panel
3. Click "Collections" → Menu → "Import"
4. Select `thunder-collection.json`
5. Import `Local Development` environment
6. Start testing!

---

### 3. **API-CHECKLIST.md**
Checklist lengkap untuk tracking progress testing.

---

## 🚀 Quick Start Testing

### Step 1: Pastikan Server Running
```bash
npm run dev
```
Server: http://localhost:3000

### Step 2: Test Login
```bash
POST http://localhost:3000/api/auth/login
Body: {
  "username": "admin",
  "password": "Admin123"
}
```

### Step 3: Copy AccessToken
Dari response, copy `data.accessToken`

### Step 4: Test Protected Endpoint
```bash
GET http://localhost:3000/api/users
Header: Authorization: Bearer {accessToken}
```

---

## 📋 ENDPOINT SUMMARY (40 Endpoints)

### 🔐 Authentication (4)
- ✅ POST `/auth/register` - Register user
- ✅ POST `/auth/login` - Login
- ✅ POST `/auth/refresh` - Refresh token
- ✅ POST `/auth/logout` - Logout

### 👥 Users (7)
- ✅ GET `/users` - List users
- ✅ GET `/users/profile` - My profile
- ✅ GET `/users/:id` - User detail
- ✅ PATCH `/users/:id` - Update user
- ✅ PATCH `/users/:id/status` - Change status
- ✅ PATCH `/users/change-password` - Change password
- ✅ DELETE `/users/:id` - Delete user

### 📂 Kategori (5)
- ✅ POST `/kategori` - Create
- ✅ GET `/kategori` - List all
- ✅ GET `/kategori/:id` - Detail
- ✅ PATCH `/kategori/:id` - Update
- ✅ DELETE `/kategori/:id` - Delete

### 🔧 Alat (6)
- ✅ POST `/alat` - Create
- ✅ GET `/alat` - List (with filter, search, pagination)
- ✅ GET `/alat/:id` - Detail
- ✅ PATCH `/alat/:id` - Update
- ✅ PATCH `/alat/:id/kondisi` - Update condition
- ✅ DELETE `/alat/:id` - Delete

### 📦 Peminjaman (5)
- ✅ POST `/peminjaman` - Request peminjaman
- ✅ GET `/peminjaman` - List all
- ✅ GET `/peminjaman/:id` - Detail
- ✅ POST `/peminjaman/:id/verify` - Approve/Reject
- ✅ PATCH `/peminjaman/:id/cancel` - Cancel

### ⏰ Perpanjangan (4)
- ✅ POST `/perpanjangan` - Request perpanjangan
- ✅ GET `/perpanjangan` - List all
- ✅ GET `/perpanjangan/:id` - Detail
- ✅ POST `/perpanjangan/:id/verify` - Approve/Reject

### 📥 Pengembalian (4)
- ✅ POST `/pengembalian` - Process return & calculate denda
- ✅ GET `/pengembalian` - List all
- ✅ GET `/pengembalian/:id` - Detail
- ✅ PATCH `/pengembalian/:id/bayar-denda` - Pay denda

### 📜 Log Aktivitas (1)
- ✅ GET `/log-aktivitas` - Activity logs (admin only)

### 📊 Laporan (4)
- ✅ GET `/laporan/dashboard` - Dashboard stats
- ✅ GET `/laporan/peminjaman` - Peminjaman report
- ✅ GET `/laporan/denda` - Denda report
- ✅ GET `/laporan/alat-terbanyak` - Top borrowed alat

---

## 🔑 Test Accounts

```
Admin:
  username: admin
  password: Admin123

Petugas:
  username: petugas1
  password: Petugas123

Peminjam:
  username: peminjam1
  password: Peminjam123
```

---

## 🧪 Recommended Testing Flow

1. **Login** as admin → Get token
2. **Create Kategori** → Get kategori ID
3. **Create Alat** → Get alat ID
4. **Login** as peminjam
5. **Request Peminjaman** → Get peminjaman ID
6. **Login** as admin/petugas
7. **Approve Peminjaman** → Status: DIPINJAM
8. **Login** as peminjam
9. **Request Perpanjangan** → Get perpanjangan ID
10. **Login** as admin/petugas
11. **Approve Perpanjangan** → Extended due date
12. **Process Pengembalian** → Calculate denda
13. **Check Dashboard** → View statistics
14. **Check Laporan** → View reports

---

## 🛠️ Tools Recommendations

### ⭐ Thunder Client (Best for VS Code)
- Install: VS Code Extensions → Search "Thunder Client"
- Import: `thunder-collection.json`
- Benefit: Integrated in VS Code, fast, lightweight

### Postman
- Download: https://www.postman.com/downloads/
- Import: Use API-TESTING-GUIDE.md to create collection
- Benefit: Full-featured, team collaboration

### Insomnia
- Download: https://insomnia.rest/download
- Import: Manual from documentation
- Benefit: Beautiful UI, GraphQL support

### cURL (Command Line)
- Use examples from API-TESTING-GUIDE.md
- Benefit: No installation needed

---

## ⚙️ Environment Variables

File: `.env`
```env
DATABASE_URL="mysql://root:@127.0.0.1:3306/peminjaman_alat"
JWT_SECRET="your-jwt-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="7d"
DENDA_PER_HARI="5000"
DENDA_RUSAK_RINGAN="20000"
DENDA_RUSAK_BERAT="50000"
MAX_PEMINJAMAN_SIMULTAN="2"
MAX_PERPANJANGAN_HARI="7"
```

---

## 📈 Features Implemented

### Core Features
- ✅ JWT Authentication (Access + Refresh token)
- ✅ Role-based authorization (ADMIN, PETUGAS, PEMINJAM)
- ✅ Rate limiting (Auth: 5/15min, API: 100/1min)
- ✅ Input validation with Zod
- ✅ Soft delete for Users, Kategori, Alat
- ✅ Activity logging

### Business Logic
- ✅ Auto-generate unique codes (kode_peminjaman)
- ✅ Auto-calculate denda (late + condition penalty)
- ✅ User eligibility checks (not blocked, max 2 loans, no overdue)
- ✅ Stock management (auto reduce/restore)
- ✅ Equipment condition tracking
- ✅ Extension rules (max 7 days, min 3 days before due, max 2 times)
- ✅ Scheduled task: Auto-block overdue users (>14 days)

### Reports & Analytics
- ✅ Dashboard statistics
- ✅ Peminjaman report by date range
- ✅ Denda report with status breakdown
- ✅ Top borrowed equipment ranking

---

## 🎯 Testing Status

| Module | Endpoints | Status |
|--------|-----------|--------|
| Authentication | 4 | ✅ Ready |
| Users | 7 | ✅ Ready |
| Kategori | 5 | ✅ Ready |
| Alat | 6 | ✅ Ready |
| Peminjaman | 5 | ✅ Ready |
| Perpanjangan | 4 | ✅ Ready |
| Pengembalian | 4 | ✅ Ready |
| Log Aktivitas | 1 | ✅ Ready |
| Laporan | 4 | ✅ Ready |
| **TOTAL** | **40** | **✅ ALL READY** |

---

## 📞 Support

Jika ada error atau pertanyaan:
1. Check **API-TESTING-GUIDE.md** untuk detail endpoint
2. Check error response format di guide
3. Check console log di terminal untuk error details
4. Pastikan database connected
5. Pastikan server running di http://localhost:3000

---

**🎉 BACKEND API COMPLETE & READY FOR TESTING!**

Silakan mulai testing dengan Thunder Client atau tools pilihan Anda!
