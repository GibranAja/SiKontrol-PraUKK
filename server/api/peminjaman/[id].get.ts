/**
 * GET /api/peminjaman/:id
 * Get loan detail
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { idParamSchema } from '~~/server/utils/validators'
import { formatResponse, formatErrorResponse, getDaysUntilDue, getDaysOverdue } from '~~/server/utils/helpers'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    if (!user) {
      throw createError({
        statusCode: 401,
        data: formatErrorResponse('UNAUTHORIZED', 'Tidak terautentikasi'),
      })
    }

    // Validate ID
    const params = event.context.params
    const validation = idParamSchema.safeParse(params)

    if (!validation.success) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'ID tidak valid'),
      })
    }

    const { id } = validation.data

    const peminjaman = await prisma.peminjaman.findUnique({
      where: { id_peminjaman: id },
      include: {
        user: {
          select: {
            id_user: true,
            username: true,
            nama_lengkap: true,
            kelas: true,
            jenis_kelamin: true,
          },
        },
        alat: {
          select: {
            id_alat: true,
            nama_alat: true,
            kode_alat: true,
            kondisi: true,
            gambar: true,
            kategori: {
              select: {
                id_kategori: true,
                nama_kategori: true,
              },
            },
          },
        },
        perpanjangan: {
          select: {
            id_perpanjangan: true,
            tanggal_pengajuan: true,
            durasi_tambahan_hari: true,
            alasan_permintaan: true,
            status_perpanjangan: true,
            alasan_ditolak_admin: true,
            tgl_disetujui: true,
          },
          orderBy: { tanggal_pengajuan: 'desc' },
        },
        pengembalian: {
          include: {
            verifikator: {
              select: {
                id_user: true,
                nama_lengkap: true,
              },
            },
          },
        },
      },
    })

    if (!peminjaman) {
      throw createError({
        statusCode: 404,
        data: formatErrorResponse('NOT_FOUND', 'Peminjaman tidak ditemukan'),
      })
    }

    // PEMINJAM can only see their own loans
    if (user.role === 'PEMINJAM' && peminjaman.id_user !== user.id_user) {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Tidak memiliki akses'),
      })
    }

    // Add computed fields
    let daysUntilDue = null
    let daysOverdue = null
    let isOverdue = false

    if (peminjaman.status_peminjaman === 'DIPINJAM' && peminjaman.tanggal_harus_kembali) {
      daysUntilDue = getDaysUntilDue(peminjaman.tanggal_harus_kembali)
      daysOverdue = getDaysOverdue(peminjaman.tanggal_harus_kembali)
      isOverdue = daysOverdue > 0
    }

    return formatResponse({
      ...peminjaman,
      computed: {
        days_until_due: daysUntilDue,
        days_overdue: daysOverdue,
        is_overdue: isOverdue,
        can_request_perpanjangan:
          peminjaman.status_peminjaman === 'DIPINJAM' &&
          daysUntilDue !== null &&
          daysUntilDue <= 3 &&
          daysUntilDue >= 0 &&
          peminjaman.perpanjangan.every(p => p.status_perpanjangan !== 'MENUNGGU'),
      },
    })
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Get peminjaman detail error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
