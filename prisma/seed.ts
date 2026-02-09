/**
 * Prisma Database Seeder
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const BCRYPT_ROUNDS = 12

interface UserData {
  id_user: number
  username: string
}

interface KategoriData {
  id_kategori: number
  nama_kategori: string
}

interface AlatData {
  id_alat: number
  nama_alat: string
  stok: number
}

async function main() {
  console.log('🌱 Starting database seed...')

  // Create Admin User
  const adminPassword = await bcrypt.hash('Admin123', BCRYPT_ROUNDS)
  const admin = await prisma.users.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      nama_lengkap: 'Administrator',
      role: 'ADMIN',
      kelas: '-',
      jenis_kelamin: 'Laki-laki',
      status_akun: 'AKTIF',
    },
  })
  console.log('✅ Admin user created:', admin.username)

  // Create Petugas Users
  const petugasPassword = await bcrypt.hash('Petugas123', BCRYPT_ROUNDS)
  const petugas1 = await prisma.users.upsert({
    where: { username: 'petugas1' },
    update: {},
    create: {
      username: 'petugas1',
      password: petugasPassword,
      nama_lengkap: 'Budi Santoso',
      role: 'PETUGAS',
      kelas: '-',
      jenis_kelamin: 'Laki-laki',
      status_akun: 'AKTIF',
    },
  })

  const petugas2 = await prisma.users.upsert({
    where: { username: 'petugas2' },
    update: {},
    create: {
      username: 'petugas2',
      password: petugasPassword,
      nama_lengkap: 'Siti Rahayu',
      role: 'PETUGAS',
      kelas: '-',
      jenis_kelamin: 'Perempuan',
      status_akun: 'AKTIF',
    },
  })
  console.log('✅ Petugas users created:', petugas1.username, petugas2.username)

  // Create Peminjam Users
  const peminjamPassword = await bcrypt.hash('Peminjam123', BCRYPT_ROUNDS)
  const peminjam: UserData[] = []

  const siswaData = [
    { username: 'peminjam1', nama: 'Andi Pratama', kelas: 'XII RPL 1', jk: 'Laki-laki' },
    { username: 'peminjam2', nama: 'Dewi Lestari', kelas: 'XII RPL 2', jk: 'Perempuan' },
    { username: 'peminjam3', nama: 'Fajar Nugroho', kelas: 'XI RPL 1', jk: 'Laki-laki' },
    { username: 'peminjam4', nama: 'Indah Permata', kelas: 'XI RPL 2', jk: 'Perempuan' },
    { username: 'peminjam5', nama: 'Kevin Pratama', kelas: 'X RPL 1', jk: 'Laki-laki' },
  ]

  for (const siswa of siswaData) {
    const user = await prisma.users.upsert({
      where: { username: siswa.username },
      update: {},
      create: {
        username: siswa.username,
        password: peminjamPassword,
        nama_lengkap: siswa.nama,
        role: 'PEMINJAM',
        kelas: siswa.kelas,
        jenis_kelamin: siswa.jk,
        status_akun: 'AKTIF',
      },
    })
    peminjam.push(user)
  }
  console.log('✅ Peminjam users created:', peminjam.length)

  // Create Kategori
  const kategoriData = [
    { nama: 'Elektronik', deskripsi: 'Peralatan elektronik seperti laptop, projector, dll' },
    { nama: 'Olahraga', deskripsi: 'Peralatan olahraga seperti bola, raket, dll' },
    { nama: 'Laboratorium', deskripsi: 'Peralatan laboratorium seperti mikroskop, gelas ukur, dll' },
  ]

  const kategori: KategoriData[] = []
  for (const kat of kategoriData) {
    const created = await prisma.kategori.create({
      data: {
        nama_kategori: kat.nama,
        deskripsi: kat.deskripsi,
      },
    })
    kategori.push(created)
  }
  console.log('✅ Kategori created:', kategori.length)

  // Create Alat
  const alatData = [
    { kode: 'ALT-001', nama: 'Laptop Asus', kategori: 0, stok: 5, harga: 5000000 },
    { kode: 'ALT-002', nama: 'Laptop HP', kategori: 0, stok: 3, harga: 4500000 },
    { kode: 'ALT-003', nama: 'Projector Epson', kategori: 0, stok: 2, harga: 3000000 },
    { kode: 'ALT-004', nama: 'Kamera DSLR', kategori: 0, stok: 2, harga: 8000000 },
    { kode: 'ALT-005', nama: 'Bola Basket', kategori: 1, stok: 10, harga: 200000 },
    { kode: 'ALT-006', nama: 'Raket Badminton', kategori: 1, stok: 8, harga: 150000 },
    { kode: 'ALT-007', nama: 'Matras Yoga', kategori: 1, stok: 15, harga: 100000 },
    { kode: 'ALT-008', nama: 'Mikroskop', kategori: 2, stok: 6, harga: 2000000 },
    { kode: 'ALT-009', nama: 'Gelas Ukur 100ml', kategori: 2, stok: 20, harga: 50000 },
    { kode: 'ALT-010', nama: 'Thermometer Digital', kategori: 2, stok: 5, harga: 300000 },
  ]

  const alat: AlatData[] = []
  for (const al of alatData) {
    const created = await prisma.alat.upsert({
      where: { kode_alat: al.kode },
      update: {},
      create: {
        kode_alat: al.kode,
        nama_alat: al.nama,
        id_kategori: kategori[al.kategori].id_kategori,
        stok: al.stok,
        kondisi: 'BAIK',
        harga: al.harga,
        spesifikasi: `${al.nama} - tersedia untuk peminjaman`,
      },
    })
    alat.push(created)
  }
  console.log('✅ Alat created:', alat.length)

  // Create Sample Peminjaman
  const today = new Date()

  // Peminjaman 1: Active Dipinjam
  await prisma.peminjaman.create({
    data: {
      kode_peminjaman: `PJM-${Date.now()}-001`,
      id_user: peminjam[0].id_user,
      id_alat: alat[0].id_alat,
      tanggal_pengajuan: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
      tanggal_pinjam: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
      tanggal_harus_kembali: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
      alasan_peminjaman: 'Untuk proyek akhir kelas',
      status_peminjaman: 'DIPINJAM',
    },
  })
  await prisma.alat.update({
    where: { id_alat: alat[0].id_alat },
    data: { stok: { decrement: 1 } },
  })

  // Peminjaman 2: Dikembalikan (Completed)
  const pinjam2 = await prisma.peminjaman.create({
    data: {
      kode_peminjaman: `PJM-${Date.now()}-002`,
      id_user: peminjam[1].id_user,
      id_alat: alat[4].id_alat,
      tanggal_pengajuan: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
      tanggal_pinjam: new Date(today.getTime() - 9 * 24 * 60 * 60 * 1000),
      tanggal_harus_kembali: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
      alasan_peminjaman: 'Latihan basket',
      status_peminjaman: 'DIKEMBALIKAN',
    },
  })
  await prisma.pengembalian.create({
    data: {
      id_peminjaman: pinjam2.id_peminjaman,
      tanggal_kembali_actual: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000),
      kondisi_alat_saat_kembali: 'BAIK',
      denda: 0,
      status_denda: 'LUNAS',
      verifikator_id: petugas1.id_user,
    },
  })

  // Peminjaman 3: Menunggu Persetujuan
  await prisma.peminjaman.create({
    data: {
      kode_peminjaman: `PJM-${Date.now()}-003`,
      id_user: peminjam[2].id_user,
      id_alat: alat[7].id_alat,
      tanggal_pengajuan: new Date(),
      alasan_peminjaman: 'Praktikum biologi',
      status_peminjaman: 'MENUNGGU_PERSETUJUAN',
    },
  })

  // Peminjaman 4: Overdue
  await prisma.peminjaman.create({
    data: {
      kode_peminjaman: `PJM-${Date.now()}-004`,
      id_user: peminjam[3].id_user,
      id_alat: alat[2].id_alat,
      tanggal_pengajuan: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
      tanggal_pinjam: new Date(today.getTime() - 9 * 24 * 60 * 60 * 1000),
      tanggal_harus_kembali: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
      alasan_peminjaman: 'Presentasi project',
      status_peminjaman: 'DIPINJAM',
    },
  })
  await prisma.alat.update({
    where: { id_alat: alat[2].id_alat },
    data: { stok: { decrement: 1 } },
  })

  // Peminjaman 5: With Perpanjangan
  const pinjam5 = await prisma.peminjaman.create({
    data: {
      kode_peminjaman: `PJM-${Date.now()}-005`,
      id_user: peminjam[4].id_user,
      id_alat: alat[5].id_alat,
      tanggal_pengajuan: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
      tanggal_pinjam: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000),
      tanggal_harus_kembali: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
      alasan_peminjaman: 'Latihan badminton',
      status_peminjaman: 'DIPINJAM',
    },
  })
  await prisma.perpanjangan.create({
    data: {
      id_peminjaman: pinjam5.id_peminjaman,
      id_user_pengaju: peminjam[4].id_user,
      tanggal_pengajuan: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
      durasi_tambahan_hari: 7,
      alasan_permintaan: 'Masih perlu untuk turnamen',
      status_perpanjangan: 'DISETUJUI',
      id_petugas_verifikator: petugas2.id_user,
      tgl_disetujui: new Date(),
    },
  })
  await prisma.alat.update({
    where: { id_alat: alat[5].id_alat },
    data: { stok: { decrement: 1 } },
  })

  console.log('✅ Sample peminjaman created: 5')

  // Create sample log activities
  await prisma.logAktivitas.createMany({
    data: [
      {
        id_user: admin.id_user,
        aktivitas: 'LOGIN',
        detail: JSON.stringify({ ip: '127.0.0.1', browser: 'Chrome' }),
        ip_address: '127.0.0.1',
      },
      {
        id_user: admin.id_user,
        aktivitas: 'CREATE_KATEGORI',
        detail: JSON.stringify({ nama: kategori[0].nama_kategori }),
        ip_address: '127.0.0.1',
      },
      {
        id_user: petugas1.id_user,
        aktivitas: 'VERIFIKASI_PEMINJAMAN',
        detail: JSON.stringify({ action: 'approve', kode: pinjam2.kode_peminjaman }),
        ip_address: '127.0.0.1',
      },
    ],
  })
  console.log('✅ Sample log activities created')

  console.log('\n🎉 Database seeding completed!')
  console.log('\n📋 Login credentials:')
  console.log('   Admin:    admin / admin123')
  console.log('   Petugas:  petugas1, petugas2 / petugas123')
  console.log('   Siswa:    siswa1-5 / siswa123')
}

main()
  .catch((e: Error) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
