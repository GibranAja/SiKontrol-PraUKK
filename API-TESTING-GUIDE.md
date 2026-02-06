# 🚀 API TESTING GUIDE - Sistem Peminjaman Alat

**Base URL:** `http://localhost:3000/api`

---

## 🔐 1. AUTHENTICATION

### 1.1. Register User
**Endpoint:** `POST /auth/register`
**Access:** Public

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePass123",
  "nama_lengkap": "John Doe",
  "role": "PEMINJAM",
  "kelas": "XII RPL 1",
  "jenis_kelamin": "Laki-laki"
}
```

**Field Rules:**
- `username`: 3-50 chars, unique
- `password`: min 6 chars
- `role`: "ADMIN" | "PETUGAS" | "PEMINJAM"
- `jenis_kelamin`: "Laki-laki" | "Perempuan"

**Response Success (201):**
```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "data": {
    "id_user": 8,
    "username": "john_doe",
    "nama_lengkap": "John Doe",
    "role": "PEMINJAM",
    "status_akun": "AKTIF"
  }
}
```

---

### 1.2. Login
**Endpoint:** `POST /auth/login`
**Access:** Public

**Request Body:**
```json
{
  "username": "admin",
  "password": "Admin123"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id_user": 1,
      "username": "admin",
      "nama_lengkap": "Administrator",
      "role": "ADMIN",
      "status_akun": "AKTIF"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Test Accounts:**
- Admin: `admin` / `Admin123`
- Petugas: `petugas1` / `Petugas123`
- Peminjam: `peminjam1` / `Peminjam123`

---

### 1.3. Refresh Token
**Endpoint:** `POST /auth/refresh`
**Access:** Public

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Token berhasil di-refresh",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 1.4. Logout
**Endpoint:** `POST /auth/logout`
**Access:** Authenticated

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Logout berhasil"
}
```

---

## 👥 2. USER MANAGEMENT

### 2.1. Get All Users
**Endpoint:** `GET /users`
**Access:** ADMIN, PETUGAS

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
?page=1
&limit=10
&search=john
&role=PEMINJAM
&status_akun=AKTIF
&sort_by=created_at
&sort_order=desc
```

**Example Request:**
```
GET /users?page=1&limit=10&role=PEMINJAM&status_akun=AKTIF
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Data users berhasil diambil",
  "data": {
    "users": [
      {
        "id_user": 3,
        "username": "peminjam1",
        "nama_lengkap": "Andi Pratama",
        "role": "PEMINJAM",
        "kelas": "XII RPL 1",
        "jenis_kelamin": "Laki-laki",
        "status_akun": "AKTIF",
        "created_at": "2026-02-05T07:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

### 2.2. Create New User (Admin Only)
**Endpoint:** `POST /users`
**Access:** ADMIN only
**Auth Required:** Yes

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "petugas_baru",
  "password": "PetugasPass123",
  "nama_lengkap": "Hendra Gunawan",
  "role": "PETUGAS",
  "kelas": "Staff",
  "jenis_kelamin": "Laki-laki",
  "status_akun": "AKTIF"
}
```

**Field Rules:**
| Field | Type | Rules |
|-------|------|-------|
| `username` | string | 3-50 chars, alphanumeric + underscore, unique |
| `password` | string | minimum 6 chars |
| `nama_lengkap` | string | 2-100 chars |
| `role` | enum | "ADMIN" \| "PETUGAS" \| "PEMINJAM" |
| `kelas` | string | 1-20 chars |
| `jenis_kelamin` | enum | "Laki-laki" \| "Perempuan" |
| `status_akun` | enum | "AKTIF" \| "DIBLOKIR" \| "NONAKTIF" (optional, default: "AKTIF") |

**Response Success (201):**
```json
{
  "success": true,
  "message": "User berhasil dibuat",
  "data": {
    "id_user": 9,
    "username": "petugas_baru",
    "nama_lengkap": "Hendra Gunawan",
    "role": "PETUGAS",
    "kelas": "Staff",
    "jenis_kelamin": "Laki-laki",
    "status_akun": "AKTIF",
    "created_at": "2026-02-06T10:25:00.000Z"
  }
}
```

**Error Response - Not Admin (403):**
```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "Hanya admin yang dapat membuat user baru"
}
```

**Error Response - Invalid Data (400):**
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Data tidak valid",
  "errors": [
    {
      "field": "username",
      "message": "Username minimal 3 karakter"
    },
    {
      "field": "password",
      "message": "Password minimal 6 karakter"
    }
  ]
}
```

**Error Response - Username Already Exists (409):**
```json
{
  "success": false,
  "code": "CONFLICT",
  "message": "Username sudah terdaftar"
}
```

**Error Response - Missing Authorization (401):**
```json
{
  "success": false,
  "code": "UNAUTHORIZED",
  "message": "Akses tidak diizinkan"
}
```

**Testing Examples:**

**1. Create PETUGAS User (Success):**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "petugas_baru",
    "password": "PetugasPass123",
    "nama_lengkap": "Hendra Gunawan",
    "role": "PETUGAS",
    "kelas": "Staff",
    "jenis_kelamin": "Laki-laki",
    "status_akun": "AKTIF"
  }'
```

**2. Create PEMINJAM User (Success):**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "siswa_baru1",
    "password": "SiswaPass123",
    "nama_lengkap": "Budi Santoso",
    "role": "PEMINJAM",
    "kelas": "XII RPL 1",
    "jenis_kelamin": "Laki-laki"
  }'
```

**3. Create with Invalid Role (400):**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user_invalid",
    "password": "Pass123",
    "nama_lengkap": "Invalid User",
    "role": "SUPERUSER",
    "kelas": "XII",
    "jenis_kelamin": "Laki-laki"
  }'
```

**4. Create with Duplicate Username (409):**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "NewPass123",
    "nama_lengkap": "New Admin",
    "role": "ADMIN",
    "kelas": "Staff",
    "jenis_kelamin": "Laki-laki"
  }'
```

**5. Create Without Admin Access (403):**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer {petugasAccessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user_baru",
    "password": "Pass123",
    "nama_lengkap": "User Baru",
    "role": "PETUGAS",
    "kelas": "Staff",
    "jenis_kelamin": "Laki-laki"
  }'
```

---

### 2.3. Get User Profile
**Endpoint:** `GET /users/profile`
**Access:** Authenticated

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Data profile berhasil diambil",
  "data": {
    "id_user": 1,
    "username": "admin",
    "nama_lengkap": "Administrator",
    "role": "ADMIN",
    "kelas": "Staff",
    "jenis_kelamin": "Laki-laki",
    "status_akun": "AKTIF",
    "created_at": "2026-02-05T07:30:00.000Z",
    "statistics": {
      "total_peminjaman": 0,
      "active_peminjaman": 0,
      "total_denda": 0
    }
  }
}
```

---

### 2.4. Get User by ID
**Endpoint:** `GET /users/:id`
**Access:** ADMIN, PETUGAS (or own profile)

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Example Request:**
```
GET /users/3
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Data user berhasil diambil",
  "data": {
    "id_user": 3,
    "username": "peminjam1",
    "nama_lengkap": "Andi Pratama",
    "role": "PEMINJAM",
    "kelas": "XII RPL 1",
    "jenis_kelamin": "Laki-laki",
    "status_akun": "AKTIF",
    "created_at": "2026-02-05T07:30:00.000Z",
    "peminjaman_count": 2,
    "active_peminjaman": 1
  }
}
```

---

### 2.5. Update User
**Endpoint:** `PUT /users/:id`
**Access:** ADMIN

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "nama_lengkap": "Andi Pratama Updated",
  "kelas": "XII RPL 2",
  "jenis_kelamin": "Laki-laki"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "User berhasil diupdate",
  "data": {
    "id_user": 3,
    "username": "peminjam1",
    "nama_lengkap": "Andi Pratama Updated",
    "kelas": "XII RPL 2"
  }
}
```

---

### 2.6. Change User Status
**Endpoint:** `PATCH /users/:id/status`
**Access:** ADMIN

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "status_akun": "DIBLOKIR",
  "alasan": "Terlambat mengembalikan > 14 hari"
}
```

**Status Options:** `"AKTIF"` | `"DIBLOKIR"` | `"NONAKTIF"`

**Response Success (200):**
```json
{
  "success": true,
  "message": "Status akun berhasil diubah",
  "data": {
    "id_user": 3,
    "username": "peminjam1",
    "status_akun": "DIBLOKIR"
  }
}
```

---

### 2.7. Change Password
**Endpoint:** `PATCH /users/change-password`
**Access:** Authenticated

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "old_password": "Peminjam123",
  "new_password": "NewSecurePass456",
  "confirm_password": "NewSecurePass456"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Password berhasil diubah"
}
```

---

### 2.8. Delete User (Soft Delete)
**Endpoint:** `DELETE /users/:id`
**Access:** ADMIN

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Example Request:**
```
DELETE /users/8
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "User berhasil dihapus"
}
```

---

## 📂 3. KATEGORI MANAGEMENT

### 3.1. Create Kategori
**Endpoint:** `POST /kategori`
**Access:** ADMIN, PETUGAS

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "nama_kategori": "Alat Musik",
  "deskripsi": "Kategori untuk alat-alat musik seperti gitar, keyboard, dll"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "Kategori berhasil dibuat",
  "data": {
    "id_kategori": 4,
    "nama_kategori": "Alat Musik",
    "deskripsi": "Kategori untuk alat-alat musik seperti gitar, keyboard, dll"
  }
}
```

---

### 3.2. Get All Kategori
**Endpoint:** `GET /kategori`
**Access:** Public

**Query Parameters:**
```
?search=elektronik
```

**Example Request:**
```
GET /kategori?search=elektronik
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Data kategori berhasil diambil",
  "data": [
    {
      "id_kategori": 1,
      "nama_kategori": "Elektronik",
      "deskripsi": "Perangkat elektronik dan teknologi",
      "alat_count": 5
    },
    {
      "id_kategori": 2,
      "nama_kategori": "Olahraga",
      "deskripsi": "Perlengkapan olahraga",
      "alat_count": 3
    }
  ]
}
```

---

### 3.3. Get Kategori by ID
**Endpoint:** `GET /kategori/:id`
**Access:** Public

**Example Request:**
```
GET /kategori/1
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Data kategori berhasil diambil",
  "data": {
    "id_kategori": 1,
    "nama_kategori": "Elektronik",
    "deskripsi": "Perangkat elektronik dan teknologi",
    "alat_count": 5,
    "alat": [
      {
        "id_alat": 1,
        "nama_alat": "Laptop Asus",
        "kode_alat": "LAPTOP-001",
        "stok": 3
      }
    ]
  }
}
```

---

### 3.4. Update Kategori
**Endpoint:** `PATCH /kategori/:id`
**Access:** ADMIN, PETUGAS

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "nama_kategori": "Elektronik & Teknologi",
  "deskripsi": "Kategori untuk perangkat elektronik dan teknologi modern"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Kategori berhasil diupdate",
  "data": {
    "id_kategori": 1,
    "nama_kategori": "Elektronik & Teknologi",
    "deskripsi": "Kategori untuk perangkat elektronik dan teknologi modern"
  }
}
```

---

### 3.5. Delete Kategori
**Endpoint:** `DELETE /kategori/:id`
**Access:** ADMIN

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Example Request:**
```
DELETE /kategori/4
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Kategori berhasil dihapus"
}
```

---

## 🔧 4. ALAT MANAGEMENT

### 4.1. Create Alat
**Endpoint:** `POST /alat`
**Access:** ADMIN, PETUGAS

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "id_kategori": 1,
  "nama_alat": "Laptop Asus ROG",
  "kode_alat": "LAPTOP-001",
  "stok": 5,
  "kondisi": "BAIK",
  "gambar": "https://example.com/laptop.jpg",
  "spesifikasi": "Intel Core i7, 16GB RAM, RTX 3060",
  "harga": 15000000
}
```

**Field Rules:**
- `kondisi`: "BAIK" | "RUSAK_RINGAN" | "RUSAK_BERAT" | "HILANG" | "PERBAIKAN"
- `kode_alat`: Unique
- `stok`: Integer >= 0
- `harga`: Integer (harga pengganti jika hilang)

**Response Success (201):**
```json
{
  "success": true,
  "message": "Alat berhasil dibuat",
  "data": {
    "id_alat": 1,
    "kode_alat": "LAPTOP-001",
    "nama_alat": "Laptop Asus ROG",
    "id_kategori": 1,
    "stok": 5,
    "kondisi": "BAIK",
    "harga": 15000000
  }
}
```

---

### 4.2. Get All Alat
**Endpoint:** `GET /alat`
**Access:** Public

**Query Parameters:**
```
?page=1
&limit=10
&search=laptop
&id_kategori=1
&kondisi=BAIK
&stok_min=1
&sort_by=nama_alat
&sort_order=asc
```

**Example Request:**
```
GET /alat?id_kategori=1&kondisi=BAIK&stok_min=1
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Data alat berhasil diambil",
  "data": {
    "alat": [
      {
        "id_alat": 1,
        "kode_alat": "LAPTOP-001",
        "nama_alat": "Laptop Asus ROG",
        "kategori": {
          "id_kategori": 1,
          "nama_kategori": "Elektronik"
        },
        "stok": 5,
        "kondisi": "BAIK",
        "gambar": "https://example.com/laptop.jpg",
        "harga": 15000000,
        "stok_tersedia": 3
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

### 4.3. Get Alat by ID
**Endpoint:** `GET /alat/:id`
**Access:** Public

**Example Request:**
```
GET /alat/1
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Data alat berhasil diambil",
  "data": {
    "id_alat": 1,
    "kode_alat": "LAPTOP-001",
    "nama_alat": "Laptop Asus ROG",
    "kategori": {
      "id_kategori": 1,
      "nama_kategori": "Elektronik"
    },
    "stok": 5,
    "stok_tersedia": 3,
    "kondisi": "BAIK",
    "gambar": "https://example.com/laptop.jpg",
    "spesifikasi": "Intel Core i7, 16GB RAM, RTX 3060",
    "harga": 15000000,
    "created_at": "2026-02-05T08:00:00.000Z"
  }
}
```

---

### 4.4. Update Alat
**Endpoint:** `PATCH /alat/:id`
**Access:** ADMIN, PETUGAS

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "nama_alat": "Laptop Asus ROG Strix",
  "stok": 6,
  "spesifikasi": "Intel Core i7 Gen 12, 16GB RAM, RTX 3060",
  "harga": 16000000
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Alat berhasil diupdate",
  "data": {
    "id_alat": 1,
    "nama_alat": "Laptop Asus ROG Strix",
    "stok": 6,
    "harga": 16000000
  }
}
```

---

### 4.5. Update Kondisi Alat
**Endpoint:** `PATCH /alat/:id/kondisi`
**Access:** ADMIN, PETUGAS

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "kondisi": "RUSAK_RINGAN",
  "catatan": "LCD sedikit retak"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Kondisi alat berhasil diupdate",
  "data": {
    "id_alat": 1,
    "kode_alat": "LAPTOP-001",
    "kondisi": "RUSAK_RINGAN"
  }
}
```

---

### 4.6. Delete Alat
**Endpoint:** `DELETE /alat/:id`
**Access:** ADMIN

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Example Request:**
```
DELETE /alat/10
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Alat berhasil dihapus"
}
```

---

## 📦 5. PEMINJAMAN

### 5.1. Create Peminjaman (Request)
**Endpoint:** `POST /peminjaman`
**Access:** Authenticated

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "id_alat": 1,
  "alasan_peminjaman": "Untuk project akhir mata kuliah",
  "keperluan_lainnya": "Akan digunakan untuk development aplikasi web selama 5 hari"
}
```

**Business Rules:**
- User tidak boleh DIBLOKIR
- Max 2 peminjaman aktif per user
- Tidak boleh ada peminjaman terlambat
- Stok alat harus tersedia

**Response Success (201):**
```json
{
  "success": true,
  "message": "Peminjaman berhasil diajukan",
  "data": {
    "id_peminjaman": 1,
    "kode_peminjaman": "PJM-20260205-001",
    "id_user": 3,
    "id_alat": 1,
    "tanggal_pengajuan": "2026-02-05T10:00:00.000Z",
    "status_peminjaman": "MENUNGGU_PERSETUJUAN",
    "alasan_peminjaman": "Untuk project akhir mata kuliah"
  }
}
```

---

### 5.2. Get All Peminjaman
**Endpoint:** `GET /peminjaman`
**Access:** Authenticated

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
?page=1
&limit=10
&status_peminjaman=DIPINJAM
&id_user=3
&id_alat=1
&tanggal_dari=2026-02-01
&tanggal_sampai=2026-02-28
&sort_by=tanggal_pengajuan
&sort_order=desc
```

**Example Request:**
```
GET /peminjaman?status_peminjaman=MENUNGGU_PERSETUJUAN
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Data peminjaman berhasil diambil",
  "data": {
    "peminjaman": [
      {
        "id_peminjaman": 1,
        "kode_peminjaman": "PJM-20260205-001",
        "user": {
          "id_user": 3,
          "nama_lengkap": "Andi Pratama",
          "kelas": "XII RPL 1"
        },
        "alat": {
          "id_alat": 1,
          "nama_alat": "Laptop Asus ROG",
          "kode_alat": "LAPTOP-001"
        },
        "tanggal_pengajuan": "2026-02-05T10:00:00.000Z",
        "tanggal_pinjam": null,
        "tanggal_harus_kembali": null,
        "status_peminjaman": "MENUNGGU_PERSETUJUAN",
        "alasan_peminjaman": "Untuk project akhir"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2
    }
  }
}
```

---

### 5.3. Get Peminjaman by ID
**Endpoint:** `GET /peminjaman/:id`
**Access:** Authenticated

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Example Request:**
```
GET /peminjaman/1
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Data peminjaman berhasil diambil",
  "data": {
    "id_peminjaman": 1,
    "kode_peminjaman": "PJM-20260205-001",
    "user": {
      "id_user": 3,
      "nama_lengkap": "Andi Pratama",
      "username": "peminjam1",
      "kelas": "XII RPL 1"
    },
    "alat": {
      "id_alat": 1,
      "nama_alat": "Laptop Asus ROG",
      "kode_alat": "LAPTOP-001",
      "kategori": "Elektronik"
    },
    "tanggal_pengajuan": "2026-02-05T10:00:00.000Z",
    "tanggal_pinjam": "2026-02-05T11:00:00.000Z",
    "tanggal_harus_kembali": "2026-02-12T11:00:00.000Z",
    "status_peminjaman": "DIPINJAM",
    "alasan_peminjaman": "Untuk project akhir",
    "keperluan_lainnya": "Development aplikasi web",
    "catatan_petugas": "Disetujui, hati-hati dalam penggunaan",
    "perpanjangan": [],
    "pengembalian": null
  }
}
```

---

### 5.4. Verify Peminjaman (Approve/Reject)
**Endpoint:** `POST /peminjaman/:id/verify`
**Access:** ADMIN, PETUGAS

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body (Approve):**
```json
{
  "action": "approve",
  "catatan_petugas": "Disetujui, harap kembalikan tepat waktu",
  "durasi_hari": 7
}
```

**Request Body (Reject):**
```json
{
  "action": "reject",
  "alasan_ditolak": "Alat sedang dalam perbaikan"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Peminjaman berhasil disetujui",
  "data": {
    "id_peminjaman": 1,
    "kode_peminjaman": "PJM-20260205-001",
    "status_peminjaman": "DISETUJUI",
    "tanggal_pinjam": "2026-02-05T11:00:00.000Z",
    "tanggal_harus_kembali": "2026-02-12T11:00:00.000Z"
  }
}
```

---

### 5.5. Cancel Peminjaman
**Endpoint:** `PATCH /peminjaman/:id/cancel`
**Access:** User (own peminjaman)

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "alasan": "Tidak jadi meminjam karena ada perubahan rencana"
}
```

**Note:** Only for status MENUNGGU_PERSETUJUAN

**Response Success (200):**
```json
{
  "success": true,
  "message": "Peminjaman berhasil dibatalkan",
  "data": {
    "id_peminjaman": 1,
    "status_peminjaman": "DITOLAK",
    "alasan_ditolak": "Dibatalkan oleh peminjam: Tidak jadi meminjam karena ada perubahan rencana"
  }
}
```

---

## ⏰ 6. PERPANJANGAN

### 6.1. Create Perpanjangan (Request)
**Endpoint:** `POST /perpanjangan`
**Access:** User (own peminjaman)

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "id_peminjaman": 1,
  "durasi_tambahan_hari": 5,
  "alasan_permintaan": "Project belum selesai, perlu waktu tambahan untuk testing"
}
```

**Business Rules:**
- Peminjaman must be DIPINJAM
- Max 7 days extension
- Request min 3 days before due date
- Max 2 perpanjangan per peminjaman

**Response Success (201):**
```json
{
  "success": true,
  "message": "Perpanjangan berhasil diajukan",
  "data": {
    "id_perpanjangan": 1,
    "id_peminjaman": 1,
    "durasi_tambahan_hari": 5,
    "alasan_permintaan": "Project belum selesai",
    "status_perpanjangan": "MENUNGGU",
    "tanggal_pengajuan": "2026-02-09T10:00:00.000Z"
  }
}
```

---

### 6.2. Get All Perpanjangan
**Endpoint:** `GET /perpanjangan`
**Access:** Authenticated

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
?page=1
&limit=10
&status_perpanjangan=MENUNGGU
&id_peminjaman=1
&sort_by=tanggal_pengajuan
&sort_order=desc
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Data perpanjangan berhasil diambil",
  "data": {
    "perpanjangan": [
      {
        "id_perpanjangan": 1,
        "peminjaman": {
          "id_peminjaman": 1,
          "kode_peminjaman": "PJM-20260205-001",
          "tanggal_harus_kembali": "2026-02-12T11:00:00.000Z"
        },
        "pengaju": {
          "id_user": 3,
          "nama_lengkap": "Andi Pratama"
        },
        "durasi_tambahan_hari": 5,
        "alasan_permintaan": "Project belum selesai",
        "status_perpanjangan": "MENUNGGU",
        "tanggal_pengajuan": "2026-02-09T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 3,
      "totalPages": 1
    }
  }
}
```

---

### 6.3. Get Perpanjangan by ID
**Endpoint:** `GET /perpanjangan/:id`
**Access:** Authenticated

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Example Request:**
```
GET /perpanjangan/1
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Data perpanjangan berhasil diambil",
  "data": {
    "id_perpanjangan": 1,
    "peminjaman": {
      "id_peminjaman": 1,
      "kode_peminjaman": "PJM-20260205-001",
      "tanggal_harus_kembali_lama": "2026-02-12T11:00:00.000Z",
      "alat": {
        "nama_alat": "Laptop Asus ROG"
      }
    },
    "pengaju": {
      "id_user": 3,
      "nama_lengkap": "Andi Pratama",
      "kelas": "XII RPL 1"
    },
    "durasi_tambahan_hari": 5,
    "tanggal_harus_kembali_baru": "2026-02-17T11:00:00.000Z",
    "alasan_permintaan": "Project belum selesai",
    "status_perpanjangan": "MENUNGGU",
    "tanggal_pengajuan": "2026-02-09T10:00:00.000Z"
  }
}
```

---

### 6.4. Verify Perpanjangan (Approve/Reject)
**Endpoint:** `POST /perpanjangan/:id/verify`
**Access:** ADMIN, PETUGAS

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body (Approve):**
```json
{
  "action": "approve"
}
```

**Request Body (Reject):**
```json
{
  "action": "reject",
  "alasan_ditolak": "Perpanjangan melebihi batas maksimal"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Perpanjangan berhasil disetujui",
  "data": {
    "id_perpanjangan": 1,
    "status_perpanjangan": "DISETUJUI",
    "tanggal_harus_kembali_baru": "2026-02-17T11:00:00.000Z",
    "tgl_disetujui": "2026-02-09T11:00:00.000Z"
  }
}
```

---

## 📥 7. PENGEMBALIAN

### 7.1. Create Pengembalian (Process Return)
**Endpoint:** `POST /pengembalian`
**Access:** ADMIN, PETUGAS

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "id_peminjaman": 1,
  "kondisi_alat_saat_kembali": "BAIK",
  "catatan_pengembalian": "Alat dikembalikan dalam kondisi baik"
}
```

**Kondisi Options:**
- `"BAIK"` - No additional charge
- `"RUSAK_RINGAN"` - +Rp 20,000
- `"RUSAK_BERAT"` - +Rp 50,000
- `"HILANG"` - Charged full harga alat

**Denda Calculation:**
- Late return: Rp 5,000 per day
- Plus kondisi penalty

**Response Success (201):**
```json
{
  "success": true,
  "message": "Pengembalian berhasil diproses",
  "data": {
    "id_pengembalian": 1,
    "id_peminjaman": 1,
    "tanggal_kembali_actual": "2026-02-15T14:00:00.000Z",
    "hari_terlambat": 3,
    "denda": 15000,
    "denda_detail": {
      "denda_keterlambatan": 15000,
      "denda_kondisi": 0,
      "total": 15000
    },
    "status_denda": "BELUM_BAYAR",
    "kondisi_alat_saat_kembali": "BAIK"
  }
}
```

---

### 7.2. Get All Pengembalian
**Endpoint:** `GET /pengembalian`
**Access:** Authenticated

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
?page=1
&limit=10
&status_denda=BELUM_BAYAR
&tanggal_dari=2026-02-01
&tanggal_sampai=2026-02-28
&sort_by=tanggal_kembali_actual
&sort_order=desc
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Data pengembalian berhasil diambil",
  "data": {
    "pengembalian": [
      {
        "id_pengembalian": 1,
        "peminjaman": {
          "id_peminjaman": 1,
          "kode_peminjaman": "PJM-20260205-001",
          "user": {
            "nama_lengkap": "Andi Pratama",
            "kelas": "XII RPL 1"
          },
          "alat": {
            "nama_alat": "Laptop Asus ROG"
          },
          "tanggal_harus_kembali": "2026-02-12T11:00:00.000Z"
        },
        "tanggal_kembali_actual": "2026-02-15T14:00:00.000Z",
        "hari_terlambat": 3,
        "denda": 15000,
        "status_denda": "BELUM_BAYAR",
        "kondisi_alat_saat_kembali": "BAIK"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 8,
      "totalPages": 1
    }
  }
}
```

---

### 7.3. Get Pengembalian by ID
**Endpoint:** `GET /pengembalian/:id`
**Access:** Authenticated

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Example Request:**
```
GET /pengembalian/1
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Data pengembalian berhasil diambil",
  "data": {
    "id_pengembalian": 1,
    "peminjaman": {
      "id_peminjaman": 1,
      "kode_peminjaman": "PJM-20260205-001",
      "user": {
        "id_user": 3,
        "nama_lengkap": "Andi Pratama",
        "kelas": "XII RPL 1"
      },
      "alat": {
        "id_alat": 1,
        "nama_alat": "Laptop Asus ROG",
        "kode_alat": "LAPTOP-001"
      },
      "tanggal_pinjam": "2026-02-05T11:00:00.000Z",
      "tanggal_harus_kembali": "2026-02-12T11:00:00.000Z"
    },
    "tanggal_kembali_actual": "2026-02-15T14:00:00.000Z",
    "hari_terlambat": 3,
    "denda": 15000,
    "status_denda": "BELUM_BAYAR",
    "kondisi_alat_saat_kembali": "BAIK",
    "catatan_pengembalian": "Alat dikembalikan dalam kondisi baik",
    "verifikator": {
      "id_user": 2,
      "nama_lengkap": "Petugas 1"
    }
  }
}
```

---

### 7.4. Bayar Denda
**Endpoint:** `PATCH /pengembalian/:id/bayar-denda`
**Access:** ADMIN, PETUGAS

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "status_denda": "LUNAS",
  "catatan": "Dibayar tunai"
}
```

**Status Options:**
- `"LUNAS"` - Fully paid
- `"DICICIL"` - Partial payment
- `"WAIVED"` - Forgiven

**Response Success (200):**
```json
{
  "success": true,
  "message": "Status denda berhasil diupdate",
  "data": {
    "id_pengembalian": 1,
    "denda": 15000,
    "status_denda": "LUNAS"
  }
}
```

---

## 📜 8. LOG AKTIVITAS

### 8.1. Get All Logs
**Endpoint:** `GET /log-aktivitas`
**Access:** ADMIN

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
?page=1
&limit=20
&id_user=3
&aktivitas=LOGIN
&tanggal_dari=2026-02-01
&tanggal_sampai=2026-02-28
&sort_by=timestamp
&sort_order=desc
```

**Example Request:**
```
GET /log-aktivitas?aktivitas=LOGIN&limit=10
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Data log aktivitas berhasil diambil",
  "data": {
    "logs": [
      {
        "id_log": 1,
        "user": {
          "id_user": 3,
          "nama_lengkap": "Andi Pratama",
          "username": "peminjam1"
        },
        "aktivitas": "LOGIN",
        "detail": "Login berhasil dari IP 127.0.0.1",
        "ip_address": "127.0.0.1",
        "timestamp": "2026-02-05T10:00:00.000Z"
      },
      {
        "id_log": 2,
        "user": {
          "id_user": 3,
          "nama_lengkap": "Andi Pratama"
        },
        "aktivitas": "CREATE_PEMINJAMAN",
        "detail": "{\"id_peminjaman\":1,\"kode\":\"PJM-20260205-001\"}",
        "ip_address": "127.0.0.1",
        "timestamp": "2026-02-05T10:05:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

---

## 📊 9. LAPORAN

### 9.1. Dashboard Statistics
**Endpoint:** `GET /laporan/dashboard`
**Access:** ADMIN, PETUGAS

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Data dashboard berhasil diambil",
  "data": {
    "users": {
      "total": 8,
      "by_role": {
        "ADMIN": 1,
        "PETUGAS": 2,
        "PEMINJAM": 5
      },
      "by_status": {
        "AKTIF": 7,
        "DIBLOKIR": 1,
        "NONAKTIF": 0
      }
    },
    "alat": {
      "total": 10,
      "stok_total": 35,
      "stok_dipinjam": 5,
      "stok_tersedia": 30,
      "by_kondisi": {
        "BAIK": 8,
        "RUSAK_RINGAN": 1,
        "RUSAK_BERAT": 0,
        "HILANG": 1,
        "PERBAIKAN": 0
      }
    },
    "peminjaman": {
      "total": 25,
      "by_status": {
        "MENUNGGU_PERSETUJUAN": 3,
        "DISETUJUI": 2,
        "DITOLAK": 5,
        "DIPINJAM": 8,
        "DIKEMBALIKAN": 7
      },
      "active": 8,
      "overdue": 2
    },
    "perpanjangan": {
      "total": 5,
      "pending": 2,
      "approved": 3
    },
    "denda": {
      "total": 150000,
      "belum_bayar": 75000,
      "lunas": 75000
    }
  }
}
```

---

### 9.2. Laporan Peminjaman
**Endpoint:** `GET /laporan/peminjaman`
**Access:** ADMIN, PETUGAS

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
?tanggal_dari=2026-02-01
&tanggal_sampai=2026-02-28
&status_peminjaman=DIKEMBALIKAN
&id_user=3
&id_alat=1
```

**Example Request:**
```
GET /laporan/peminjaman?tanggal_dari=2026-02-01&tanggal_sampai=2026-02-28
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Laporan peminjaman berhasil diambil",
  "data": {
    "filter": {
      "tanggal_dari": "2026-02-01",
      "tanggal_sampai": "2026-02-28"
    },
    "summary": {
      "total_peminjaman": 15,
      "by_status": {
        "MENUNGGU_PERSETUJUAN": 2,
        "DISETUJUI": 1,
        "DIPINJAM": 5,
        "DIKEMBALIKAN": 7
      },
      "total_terlambat": 3
    },
    "data": [
      {
        "kode_peminjaman": "PJM-20260205-001",
        "peminjam": "Andi Pratama",
        "kelas": "XII RPL 1",
        "alat": "Laptop Asus ROG",
        "tanggal_pinjam": "2026-02-05T11:00:00.000Z",
        "tanggal_harus_kembali": "2026-02-12T11:00:00.000Z",
        "tanggal_kembali": "2026-02-15T14:00:00.000Z",
        "status": "DIKEMBALIKAN",
        "terlambat": true,
        "hari_terlambat": 3,
        "denda": 15000
      }
    ]
  }
}
```

---

### 9.3. Laporan Denda
**Endpoint:** `GET /laporan/denda`
**Access:** ADMIN, PETUGAS

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
?tanggal_dari=2026-02-01
&tanggal_sampai=2026-02-28
&status_denda=BELUM_BAYAR
```

**Example Request:**
```
GET /laporan/denda?status_denda=BELUM_BAYAR
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Laporan denda berhasil diambil",
  "data": {
    "filter": {
      "tanggal_dari": "2026-02-01",
      "tanggal_sampai": "2026-02-28",
      "status_denda": "BELUM_BAYAR"
    },
    "summary": {
      "total_denda": 150000,
      "total_transaksi": 10,
      "by_status": [
        {
          "status": "BELUM_BAYAR",
          "status_display": "Belum Bayar",
          "jumlah": 5,
          "total": 75000,
          "total_formatted": "Rp 75.000"
        },
        {
          "status": "LUNAS",
          "status_display": "Lunas",
          "jumlah": 4,
          "total": 60000,
          "total_formatted": "Rp 60.000"
        },
        {
          "status": "WAIVED",
          "status_display": "Dibebaskan",
          "jumlah": 1,
          "total": 15000,
          "total_formatted": "Rp 15.000"
        }
      ]
    },
    "data": [
      {
        "id_pengembalian": 1,
        "tanggal_kembali": "2026-02-15T14:00:00.000Z",
        "kode_peminjaman": "PJM-20260205-001",
        "nama_peminjam": "Andi Pratama",
        "kelas": "XII RPL 1",
        "nama_alat": "Laptop Asus ROG",
        "hari_terlambat": 3,
        "denda": 15000,
        "denda_formatted": "Rp 15.000",
        "status_denda": "BELUM_BAYAR",
        "status_denda_display": "Belum Bayar"
      }
    ]
  }
}
```

---

### 9.4. Laporan Alat Terbanyak
**Endpoint:** `GET /laporan/alat-terbanyak`
**Access:** ADMIN, PETUGAS

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
?periode=month
&limit=10
```

**Periode Options:**
- `all` - All time
- `month` - Current month
- `year` - Current year

**Example Request:**
```
GET /laporan/alat-terbanyak?periode=month&limit=5
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Laporan alat terbanyak berhasil diambil",
  "data": {
    "periode": "month",
    "summary": {
      "total_alat": 5,
      "total_peminjaman": 45
    },
    "data": [
      {
        "rank": 1,
        "id_alat": 1,
        "kode_alat": "LAPTOP-001",
        "nama_alat": "Laptop Asus ROG",
        "kategori": "Elektronik",
        "gambar": "https://example.com/laptop.jpg",
        "total_peminjaman": 15,
        "percentage": 33.33
      },
      {
        "rank": 2,
        "id_alat": 3,
        "kode_alat": "PROJ-001",
        "nama_alat": "Projector Epson",
        "kategori": "Elektronik",
        "gambar": null,
        "total_peminjaman": 12,
        "percentage": 26.67
      }
    ]
  }
}
```

---

## 🔒 Common Error Responses

### 400 - Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data tidak valid",
    "details": {
      "username": "Username minimal 3 karakter"
    }
  }
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token tidak valid atau expired"
  }
}
```

### 403 - Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Tidak memiliki akses"
  }
}
```

### 404 - Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Data tidak ditemukan"
  }
}
```

### 429 - Rate Limit Exceeded
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Terlalu banyak request. Coba lagi dalam 60 detik."
  }
}
```

### 500 - Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Terjadi kesalahan server"
  }
}
```

---

## 📝 Testing Notes

### Authentication Flow:
1. Register/Login to get `accessToken`
2. Include `Authorization: Bearer {token}` in all protected requests
3. Token expires in 15 minutes
4. Use refresh endpoint to get new token

### Test Sequence:
1. ✅ Login as admin
2. ✅ Create Kategori
3. ✅ Create Alat
4. ✅ Login as peminjam
5. ✅ Create Peminjaman
6. ✅ Login as admin/petugas
7. ✅ Approve Peminjaman
8. ✅ Request Perpanjangan
9. ✅ Approve Perpanjangan
10. ✅ Process Pengembalian
11. ✅ Check Laporan

### Rate Limits:
- Auth endpoints: 5 requests / 15 minutes
- Other endpoints: 100 requests / 1 minute

### Environment Variables (.env):
```env
DATABASE_URL="mysql://root:@127.0.0.1:3306/peminjaman_alat"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
```

---

**✅ READY FOR TESTING!**

Gunakan tools seperti:
- **Thunder Client** (VS Code Extension) ⭐ Recommended
- **Postman**
- **Insomnia**
- **curl** (command line)

Import collection atau copy-paste request examples di atas! 🚀
