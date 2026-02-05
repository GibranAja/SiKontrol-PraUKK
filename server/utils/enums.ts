/**
 * Enum Definitions & Display Mappings
 * Provides human-readable labels for database enums
 */

// ========== Role Type ==========
export const RoleTypeDisplay: Record<string, string> = {
  ADMIN: 'Administrator',
  PETUGAS: 'Petugas',
  PEMINJAM: 'Peminjam',
}

export const RoleTypeValues = ['ADMIN', 'PETUGAS', 'PEMINJAM'] as const
export type RoleTypeEnum = typeof RoleTypeValues[number]

// ========== Status Akun ==========
export const StatusAkunDisplay: Record<string, string> = {
  AKTIF: 'Aktif',
  DIBLOKIR: 'Diblokir',
  NONAKTIF: 'Nonaktif',
}

export const StatusAkunValues = ['AKTIF', 'DIBLOKIR', 'NONAKTIF'] as const
export type StatusAkunEnum = typeof StatusAkunValues[number]

// ========== Status Peminjaman ==========
export const StatusPeminjamanDisplay: Record<string, string> = {
  MENUNGGU_PERSETUJUAN: 'Menunggu Persetujuan',
  DISETUJUI: 'Disetujui',
  DITOLAK: 'Ditolak',
  DIPINJAM: 'Sedang Dipinjam',
  DIKEMBALIKAN: 'Dikembalikan',
}

export const StatusPeminjamanValues = [
  'MENUNGGU_PERSETUJUAN',
  'DISETUJUI',
  'DITOLAK',
  'DIPINJAM',
  'DIKEMBALIKAN',
] as const
export type StatusPeminjamanEnum = typeof StatusPeminjamanValues[number]

// ========== Status Perpanjangan ==========
export const StatusPerpanjanganDisplay: Record<string, string> = {
  MENUNGGU: 'Menunggu',
  DISETUJUI: 'Disetujui',
  DITOLAK: 'Ditolak',
}

export const StatusPerpanjanganValues = ['MENUNGGU', 'DISETUJUI', 'DITOLAK'] as const
export type StatusPerpanjanganEnum = typeof StatusPerpanjanganValues[number]

// ========== Status Denda ==========
export const StatusDendaDisplay: Record<string, string> = {
  BELUM_BAYAR: 'Belum Bayar',
  LUNAS: 'Lunas',
  DICICIL: 'Dicicil',
  WAIVED: 'Dibebaskan',
}

export const StatusDendaValues = ['BELUM_BAYAR', 'LUNAS', 'DICICIL', 'WAIVED'] as const
export type StatusDendaEnum = typeof StatusDendaValues[number]

// ========== Kondisi Alat ==========
export const KondisiTypeDisplay: Record<string, string> = {
  BAIK: 'Baik',
  RUSAK_RINGAN: 'Rusak Ringan',
  RUSAK_BERAT: 'Rusak Berat',
  HILANG: 'Hilang',
  PERBAIKAN: 'Dalam Perbaikan',
}

export const KondisiTypeValues = [
  'BAIK',
  'RUSAK_RINGAN',
  'RUSAK_BERAT',
  'HILANG',
  'PERBAIKAN',
] as const
export type KondisiTypeEnum = typeof KondisiTypeValues[number]

// ========== Aktivitas Types ==========
export const AktivitasType = {
  // Auth
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',

  // Users
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  BLOCK_USER: 'BLOCK_USER',
  UNBLOCK_USER: 'UNBLOCK_USER',

  // Kategori
  CREATE_KATEGORI: 'CREATE_KATEGORI',
  UPDATE_KATEGORI: 'UPDATE_KATEGORI',
  DELETE_KATEGORI: 'DELETE_KATEGORI',

  // Alat
  CREATE_ALAT: 'CREATE_ALAT',
  UPDATE_ALAT: 'UPDATE_ALAT',
  DELETE_ALAT: 'DELETE_ALAT',
  UPDATE_STOK_ALAT: 'UPDATE_STOK_ALAT',
  UPDATE_KONDISI_ALAT: 'UPDATE_KONDISI_ALAT',

  // Peminjaman
  AJUKAN_PEMINJAMAN: 'AJUKAN_PEMINJAMAN',
  SETUJUI_PEMINJAMAN: 'SETUJUI_PEMINJAMAN',
  TOLAK_PEMINJAMAN: 'TOLAK_PEMINJAMAN',
  CANCEL_PEMINJAMAN: 'CANCEL_PEMINJAMAN',

  // Perpanjangan
  AJUKAN_PERPANJANGAN: 'AJUKAN_PERPANJANGAN',
  SETUJUI_PERPANJANGAN: 'SETUJUI_PERPANJANGAN',
  TOLAK_PERPANJANGAN: 'TOLAK_PERPANJANGAN',

  // Pengembalian
  PROSES_PENGEMBALIAN: 'PROSES_PENGEMBALIAN',
  BAYAR_DENDA: 'BAYAR_DENDA',
  WAIVE_DENDA: 'WAIVE_DENDA',

  // System
  AUTO_BLACKLIST: 'AUTO_BLACKLIST',
  SEND_REMINDER: 'SEND_REMINDER',
} as const

export const AktivitasTypeDisplay: Record<string, string> = {
  LOGIN: 'Login ke sistem',
  LOGOUT: 'Logout dari sistem',
  REGISTER: 'Registrasi akun baru',
  CREATE_USER: 'Membuat user baru',
  UPDATE_USER: 'Memperbarui data user',
  DELETE_USER: 'Menghapus user',
  BLOCK_USER: 'Memblokir user',
  UNBLOCK_USER: 'Membuka blokir user',
  CREATE_KATEGORI: 'Membuat kategori baru',
  UPDATE_KATEGORI: 'Memperbarui kategori',
  DELETE_KATEGORI: 'Menghapus kategori',
  CREATE_ALAT: 'Menambah alat baru',
  UPDATE_ALAT: 'Memperbarui data alat',
  DELETE_ALAT: 'Menghapus alat',
  UPDATE_STOK_ALAT: 'Memperbarui stok alat',
  UPDATE_KONDISI_ALAT: 'Memperbarui kondisi alat',
  AJUKAN_PEMINJAMAN: 'Mengajukan peminjaman',
  SETUJUI_PEMINJAMAN: 'Menyetujui peminjaman',
  TOLAK_PEMINJAMAN: 'Menolak peminjaman',
  CANCEL_PEMINJAMAN: 'Membatalkan peminjaman',
  AJUKAN_PERPANJANGAN: 'Mengajukan perpanjangan',
  SETUJUI_PERPANJANGAN: 'Menyetujui perpanjangan',
  TOLAK_PERPANJANGAN: 'Menolak perpanjangan',
  PROSES_PENGEMBALIAN: 'Memproses pengembalian',
  BAYAR_DENDA: 'Membayar denda',
  WAIVE_DENDA: 'Membebaskan denda',
  AUTO_BLACKLIST: 'Auto-blacklist oleh sistem',
  SEND_REMINDER: 'Mengirim reminder',
}
