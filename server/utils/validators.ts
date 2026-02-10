/**
 * Zod Validation Schemas
 * Input validation for all API endpoints
 */

import { z } from 'zod'

// ========== COMMON SCHEMAS ==========

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('ID harus berupa angka positif'),
})

// ========== AUTH SCHEMAS ==========

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username minimal 3 karakter')
    .max(50, 'Username maksimal 50 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore'),
  password: z
    .string()
    .min(6, 'Password minimal 6 karakter')
    .max(100, 'Password maksimal 100 karakter'),
  nama_lengkap: z
    .string()
    .min(2, 'Nama lengkap minimal 2 karakter')
    .max(100, 'Nama lengkap maksimal 100 karakter'),
  kelas: z
    .string()
    .min(1, 'Kelas wajib diisi')
    .max(20, 'Kelas maksimal 20 karakter'),
  jenis_kelamin: z.enum(['Laki-laki', 'Perempuan'], {
    errorMap: () => ({ message: 'Jenis kelamin harus Laki-laki atau Perempuan' }),
  }),
})

export const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token wajib diisi'),
})

export const changePasswordSchema = z.object({
  new_password: z
    .string()
    .min(6, 'Password baru minimal 6 karakter')
    .max(100, 'Password baru maksimal 100 karakter'),
  confirm_password: z.string().min(1, 'Konfirmasi password wajib diisi'),
})

// ========== USER SCHEMAS ==========

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username minimal 3 karakter')
    .max(50, 'Username maksimal 50 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore'),
  password: z
    .string()
    .min(6, 'Password minimal 6 karakter')
    .max(100, 'Password maksimal 100 karakter'),
  nama_lengkap: z
    .string()
    .min(2, 'Nama lengkap minimal 2 karakter')
    .max(100, 'Nama lengkap maksimal 100 karakter'),
  role: z.enum(['ADMIN', 'PETUGAS', 'PEMINJAM'], {
    errorMap: () => ({ message: 'Role tidak valid' }),
  }),
  kelas: z
    .string()
    .min(1, 'Kelas wajib diisi')
    .max(20, 'Kelas maksimal 20 karakter'),
  jenis_kelamin: z.enum(['Laki-laki', 'Perempuan'], {
    errorMap: () => ({ message: 'Jenis kelamin harus Laki-laki atau Perempuan' }),
  }),
  status_akun: z.enum(['AKTIF', 'DIBLOKIR', 'NONAKTIF']).optional().default('AKTIF'),
})

export const updateUserSchema = z.object({
  nama_lengkap: z
    .string()
    .min(2, 'Nama lengkap minimal 2 karakter')
    .max(100, 'Nama lengkap maksimal 100 karakter')
    .optional(),
  kelas: z
    .string()
    .min(1, 'Kelas wajib diisi')
    .max(20, 'Kelas maksimal 20 karakter')
    .optional(),
  jenis_kelamin: z.enum(['Laki-laki', 'Perempuan']).optional(),
  password: z
    .string()
    .min(6, 'Password minimal 6 karakter')
    .max(100, 'Password maksimal 100 karakter')
    .optional(),
})

export const updateUserStatusSchema = z.object({
  status_akun: z.enum(['AKTIF', 'DIBLOKIR', 'NONAKTIF'], {
    errorMap: () => ({ message: 'Status akun tidak valid' }),
  }),
  catatan: z.string().max(500, 'Catatan maksimal 500 karakter').optional(),
})

export const userFilterSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'PETUGAS', 'PEMINJAM']).optional(),
  status_akun: z.enum(['AKTIF', 'DIBLOKIR', 'NONAKTIF']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

// ========== KATEGORI SCHEMAS ==========

export const createKategoriSchema = z.object({
  nama_kategori: z
    .string()
    .min(2, 'Nama kategori minimal 2 karakter')
    .max(50, 'Nama kategori maksimal 50 karakter'),
  deskripsi: z.string().max(1000, 'Deskripsi maksimal 1000 karakter').optional(),
})

export const updateKategoriSchema = z.object({
  nama_kategori: z
    .string()
    .min(2, 'Nama kategori minimal 2 karakter')
    .max(50, 'Nama kategori maksimal 50 karakter')
    .optional(),
  deskripsi: z.string().max(1000, 'Deskripsi maksimal 1000 karakter').optional(),
})

// ========== ALAT SCHEMAS ==========

export const createAlatSchema = z.object({
  id_kategori: z.number().int().positive('ID kategori harus valid'),
  nama_alat: z
    .string()
    .min(2, 'Nama alat minimal 2 karakter')
    .max(100, 'Nama alat maksimal 100 karakter'),
  kode_alat: z
    .string()
    .min(3, 'Kode alat minimal 3 karakter')
    .max(50, 'Kode alat maksimal 50 karakter')
    .optional(),
  stok: z.number().int().min(0, 'Stok tidak boleh negatif').default(0),
  kondisi: z.enum(['BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT', 'HILANG', 'PERBAIKAN']).default('BAIK'),
  gambar: z.string().optional(),
  spesifikasi: z.string().max(2000, 'Spesifikasi maksimal 2000 karakter').optional(),
  harga: z.number().int().min(0, 'Harga tidak boleh negatif').default(0),
})

export const updateAlatSchema = z.object({
  id_kategori: z.number().int().positive('ID kategori harus valid').optional(),
  nama_alat: z
    .string()
    .min(2, 'Nama alat minimal 2 karakter')
    .max(100, 'Nama alat maksimal 100 karakter')
    .optional(),
  kode_alat: z
    .string()
    .min(3, 'Kode alat minimal 3 karakter')
    .max(50, 'Kode alat maksimal 50 karakter')
    .optional(),
  stok: z.number().int().min(0, 'Stok tidak boleh negatif').optional(),
  kondisi: z.enum(['BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT', 'HILANG', 'PERBAIKAN']).optional(),
  gambar: z.string().optional(),
  spesifikasi: z.string().max(2000, 'Spesifikasi maksimal 2000 karakter').optional(),
  harga: z.number().int().min(0, 'Harga tidak boleh negatif').optional(),
})

export const updateStokSchema = z.object({
  stok: z.number().int().min(0, 'Stok tidak boleh negatif'),
  catatan: z.string().max(500, 'Catatan maksimal 500 karakter').optional(),
})

export const updateKondisiSchema = z.object({
  kondisi: z.enum(['BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT', 'HILANG', 'PERBAIKAN'], {
    errorMap: () => ({ message: 'Kondisi tidak valid' }),
  }),
  catatan: z.string().max(500, 'Catatan maksimal 500 karakter').optional(),
})

export const alatFilterSchema = z.object({
  search: z.string().optional(),
  id_kategori: z.coerce.number().int().positive().optional(),
  kondisi: z.enum(['BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT', 'HILANG', 'PERBAIKAN']).optional(),
  tersedia: z.coerce.boolean().optional(), // stok > 0
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

// ========== PEMINJAMAN SCHEMAS ==========

export const createPeminjamanSchema = z.object({
  id_alat: z.number().int().positive('ID alat harus valid'),
  alasan_peminjaman: z
    .string()
    .min(10, 'Alasan peminjaman minimal 10 karakter')
    .max(1000, 'Alasan peminjaman maksimal 1000 karakter'),
  keperluan_lainnya: z.string().max(1000, 'Keperluan lainnya maksimal 1000 karakter').optional(),
  tanggal_pinjam: z.coerce.date().optional(),
})

export const verifyPeminjamanSchema = z.object({
  action: z.enum(['DISETUJUI', 'DITOLAK'], {
    errorMap: () => ({ message: 'Action harus DISETUJUI atau DITOLAK' }),
  }),
  catatan_petugas: z.string().max(1000, 'Catatan petugas maksimal 1000 karakter').optional(),
  alasan_ditolak: z.string().max(1000, 'Alasan ditolak maksimal 1000 karakter').optional(),
  durasi_pinjam_hari: z.number().int().min(1).max(30).optional().default(7),
})

export const peminjamanFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['MENUNGGU_PERSETUJUAN', 'DISETUJUI', 'DITOLAK', 'DIPINJAM', 'DIKEMBALIKAN']).optional(),
  id_user: z.coerce.number().int().positive().optional(),
  tanggal_dari: z.coerce.date().optional(),
  tanggal_sampai: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

// ========== PERPANJANGAN SCHEMAS ==========

export const createPerpanjanganSchema = z.object({
  id_peminjaman: z.number().int().positive('ID peminjaman harus valid'),
  durasi_tambahan_hari: z
    .number()
    .int()
    .min(1, 'Durasi minimal 1 hari')
    .max(7, 'Durasi maksimal 7 hari'),
  alasan_permintaan: z
    .string()
    .min(10, 'Alasan permintaan minimal 10 karakter')
    .max(1000, 'Alasan permintaan maksimal 1000 karakter'),
})

export const verifyPerpanjanganSchema = z.object({
  action: z.enum(['DISETUJUI', 'DITOLAK'], {
    errorMap: () => ({ message: 'Action harus DISETUJUI atau DITOLAK' }),
  }),
  alasan_ditolak_admin: z.string().max(1000, 'Alasan ditolak maksimal 1000 karakter').optional(),
})

export const perpanjanganFilterSchema = z.object({
  status: z.enum(['MENUNGGU', 'DISETUJUI', 'DITOLAK']).optional(),
  id_user: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

// ========== PENGEMBALIAN SCHEMAS ==========

export const createPengembalianSchema = z.object({
  id_peminjaman: z.number().int().positive('ID peminjaman harus valid'),
  kondisi_alat_saat_kembali: z.enum(['BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT', 'HILANG'], {
    errorMap: () => ({ message: 'Kondisi alat tidak valid' }),
  }),
  catatan_pengembalian: z.string().max(1000, 'Catatan maksimal 1000 karakter').optional(),
  denda_rusak_manual: z.number().int().min(0, 'Denda tidak boleh negatif').optional(),
})

export const updateDendaSchema = z.object({
  status_denda: z.enum(['LUNAS', 'DICICIL', 'WAIVED'], {
    errorMap: () => ({ message: 'Status denda tidak valid' }),
  }),
  alasan_waive: z.string().max(500, 'Alasan waive maksimal 500 karakter').optional(),
})

// ========== LOG AKTIVITAS SCHEMAS ==========

export const logFilterSchema = z.object({
  id_user: z.coerce.number().int().positive().optional(),
  aktivitas: z.string().optional(),
  tanggal_dari: z.coerce.date().optional(),
  tanggal_sampai: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

// ========== LAPORAN SCHEMAS ==========

export const laporanPeminjamanSchema = z.object({
  tanggal_dari: z.coerce.date().optional(),
  tanggal_sampai: z.coerce.date().optional(),
  status: z.enum(['MENUNGGU_PERSETUJUAN', 'DISETUJUI', 'DITOLAK', 'DIPINJAM', 'DIKEMBALIKAN']).optional(),
  format: z.enum(['json', 'csv']).default('json'),
})

export const laporanDendaSchema = z.object({
  tanggal_dari: z.coerce.date().optional(),
  tanggal_sampai: z.coerce.date().optional(),
  status_denda: z.enum(['BELUM_BAYAR', 'LUNAS', 'DICICIL', 'WAIVED']).optional(),
})

// ========== TYPE EXPORTS ==========

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>
export type CreateKategoriInput = z.infer<typeof createKategoriSchema>
export type UpdateKategoriInput = z.infer<typeof updateKategoriSchema>
export type CreateAlatInput = z.infer<typeof createAlatSchema>
export type UpdateAlatInput = z.infer<typeof updateAlatSchema>
export type CreatePeminjamanInput = z.infer<typeof createPeminjamanSchema>
export type VerifyPeminjamanInput = z.infer<typeof verifyPeminjamanSchema>
export type CreatePerpanjanganInput = z.infer<typeof createPerpanjanganSchema>
export type VerifyPerpanjanganInput = z.infer<typeof verifyPerpanjanganSchema>
export type CreatePengembalianInput = z.infer<typeof createPengembalianSchema>
export type UpdateDendaInput = z.infer<typeof updateDendaSchema>
