import prisma from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const currentUser = event.context.user

    if (!currentUser) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized'
      })
    }

    const user = await prisma.users.findUnique({
      where: {
        id_user: currentUser.id_user
      },
      select: {
        id_user: true,
        username: true,
        nama_lengkap: true,
        role: true,
        kelas: true,
        jenis_kelamin: true,
        status_akun: true,
        created_at: true
      }
    })

    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'User tidak ditemukan'
      })
    }

    const total_peminjaman = await prisma.peminjaman.count({
      where: {
        id_user: user.id_user
      }
    })

    const active_peminjaman = await prisma.peminjaman.count({
      where: {
        id_user: user.id_user,
        status_peminjaman: 'DIPINJAM'
      }
    })

    const dendaResult = await prisma.pengembalian.aggregate({
      where: {
        peminjaman: {
          id_user: user.id_user
        },
        status_denda: 'BELUM_BAYAR'
      },
      _sum: {
        denda: true
      }
    })

    const total_denda = dendaResult._sum.denda || 0

    return {
      success: true,
      message: 'Data profile berhasil diambil',
      data: {
        ...user,
        statistics: {
          total_peminjaman,
          active_peminjaman,
          total_denda
        }
      }
    }
  } catch (error: any) {
    console.error('Error get profile:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'Terjadi kesalahan saat mengambil data profile'
    })
  }
})
