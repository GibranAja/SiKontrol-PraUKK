/**
 * POST /api/pengembalian
 * Process return (Admin/Petugas only)
 */

import { createError } from 'h3'
import prisma from '~~/server/utils/prisma'
import { createPengembalianSchema } from '~~/server/utils/validators'
import { formatResponse, formatErrorResponse, calculateDenda } from '~~/server/utils/helpers'
import { logActivityFromEvent } from '~~/server/utils/logger'
import { AktivitasType, KondisiTypeDisplay } from '~~/server/utils/enums'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    if (!user || !['ADMIN', 'PETUGAS'].includes(user.role)) {
      throw createError({
        statusCode: 403,
        data: formatErrorResponse('FORBIDDEN', 'Tidak memiliki akses'),
      })
    }

    // Parse and validate body
    const body = await readBody(event)
    const validation = createPengembalianSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))

      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'Data tidak valid', errors),
      })
    }

    const { id_peminjaman, kondisi_alat_saat_kembali, catatan_pengembalian } = validation.data

    // Get peminjaman with alat
    const peminjaman = await prisma.peminjaman.findUnique({
      where: { id_peminjaman },
      include: {
        alat: true,
        user: {
          select: {
            nama_lengkap: true,
          },
        },
        pengembalian: true,
      },
    })

    if (!peminjaman) {
      throw createError({
        statusCode: 404,
        data: formatErrorResponse('NOT_FOUND', 'Peminjaman tidak ditemukan'),
      })
    }

    // Check status
    if (peminjaman.status_peminjaman !== 'DIPINJAM') {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse(
          'VALIDATION_ERROR',
          `Peminjaman tidak dapat dikembalikan. Status saat ini: ${peminjaman.status_peminjaman}`
        ),
      })
    }

    // Check if already returned
    if (peminjaman.pengembalian) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'Peminjaman sudah dikembalikan'),
      })
    }

    // Calculate fine
    const now = new Date()
    const dendaResult = calculateDenda(
      peminjaman.tanggal_harus_kembali!,
      now,
      kondisi_alat_saat_kembali,
      peminjaman.alat.harga
    )

    // Determine if stock should be restored (not if lost)
    const shouldRestoreStock = kondisi_alat_saat_kembali !== 'HILANG'

    // Determine new equipment condition
    let newKondisiAlat = peminjaman.alat.kondisi
    if (kondisi_alat_saat_kembali === 'RUSAK_RINGAN' || kondisi_alat_saat_kembali === 'RUSAK_BERAT') {
      // Update equipment condition if it's worse
      const kondisiPriority: Record<string, number> = {
        'BAIK': 0,
        'RUSAK_RINGAN': 1,
        'RUSAK_BERAT': 2,
        'HILANG': 3,
        'PERBAIKAN': 2,
      }

      if ((kondisiPriority[kondisi_alat_saat_kembali] ?? 0) > (kondisiPriority[peminjaman.alat.kondisi] ?? 0)) {
        newKondisiAlat = kondisi_alat_saat_kembali as any
      }
    } else if (kondisi_alat_saat_kembali === 'HILANG') {
      newKondisiAlat = 'HILANG' as any
    }

    // Use transaction for atomic operation
    const [pengembalian] = await prisma.$transaction([
      // Create pengembalian
      prisma.pengembalian.create({
        data: {
          id_peminjaman,
          tanggal_kembali_actual: now,
          denda: dendaResult.total,
          status_denda: dendaResult.total > 0 ? 'BELUM_BAYAR' : 'LUNAS',
          kondisi_alat_saat_kembali,
          catatan_pengembalian,
          verifikator_id: user.id_user,
        },
        include: {
          peminjaman: {
            select: {
              kode_peminjaman: true,
              tanggal_harus_kembali: true,
              alat: {
                select: {
                  nama_alat: true,
                },
              },
            },
          },
        },
      }),
      // Update peminjaman status
      prisma.peminjaman.update({
        where: { id_peminjaman },
        data: {
          status_peminjaman: 'DIKEMBALIKAN',
        },
      }),
      // Update alat (stock and condition)
      prisma.alat.update({
        where: { id_alat: peminjaman.id_alat },
        data: {
          ...(shouldRestoreStock && { stok: { increment: 1 } }),
          kondisi: newKondisiAlat,
        },
      }),
    ])

    // Log activity
    let logDetail = `Memproses pengembalian ${peminjaman.kode_peminjaman}. Kondisi: ${KondisiTypeDisplay[kondisi_alat_saat_kembali]}.`
    if (dendaResult.total > 0) {
      logDetail += ` Denda: Rp ${dendaResult.total.toLocaleString('id-ID')}`
      if (dendaResult.breakdown.keterlambatan > 0) {
        logDetail += ` (keterlambatan: Rp ${dendaResult.breakdown.keterlambatan.toLocaleString('id-ID')})`
      }
      if (dendaResult.breakdown.kondisi > 0) {
        logDetail += ` (kondisi: Rp ${dendaResult.breakdown.kondisi.toLocaleString('id-ID')})`
      }
    }

    await logActivityFromEvent(
      event,
      AktivitasType.PROSES_PENGEMBALIAN,
      logDetail
    )

    return formatResponse({
      ...pengembalian,
      denda_breakdown: dendaResult.breakdown,
    }, undefined, 'Pengembalian berhasil diproses')
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Create pengembalian error:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan server'),
    })
  }
})
