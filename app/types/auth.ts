// Auth Types
export interface User {
  id_user: number
  username: string
  nama_lengkap: string
  role: 'ADMIN' | 'PETUGAS' | 'PEMINJAM'
  kelas: string
  jenis_kelamin: string
  status_akun: 'AKTIF' | 'DIBLOKIR' | 'NONAKTIF'
  created_at: string
}

export interface LoginPayload {
  username: string
  password: string
}

export interface RegisterPayload {
  username: string
  password: string
  nama_lengkap: string
  kelas: string
  jenis_kelamin: 'Laki-laki' | 'Perempuan'
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginResponse {
  success: boolean
  message: string
  data: {
    user: User
    accessToken: string
    refreshToken: string
  }
}

export interface RegisterResponse {
  success: boolean
  message: string
  data: User
}

export interface ApiErrorResponse {
  success: boolean
  error: {
    code: string
    message: string
    details?: Array<{
      field: string
      message: string
    }>
  }
}
