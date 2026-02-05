/**
 * Scheduled Task: Auto Blacklist
 * Runs daily at 00:00 to blacklist users with loans overdue > 14 days
 *
 * To enable in nuxt.config.ts:
 * experimental: {
 *   tasks: true
 * },
 * scheduledTasks: {
 *   '0 0 * * *': ['auto:blacklist']
 * }
 */

import prisma from '~~/server/utils/prisma'
import { logger } from '~~/server/utils/logger'

export default defineTask({
  meta: {
    name: 'auto:blacklist',
    description: 'Automatically blacklist users with severely overdue loans',
  },
  async run() {
    logger.info('Running auto:blacklist task')

    try {
      const config = useRuntimeConfig()
      const overdueThreshold = config.blacklistOverdueDays || 14

      const thresholdDate = new Date()
      thresholdDate.setDate(thresholdDate.getDate() - overdueThreshold)
      thresholdDate.setHours(23, 59, 59, 999)

      // Find users with severely overdue loans
      const overdueLoans = await prisma.peminjaman.findMany({
        where: {
          status_peminjaman: 'DIPINJAM',
          tanggal_harus_kembali: {
            lt: thresholdDate,
          },
        },
        include: {
          user: {
            select: {
              id_user: true,
              username: true,
              nama_lengkap: true,
              status_akun: true,
            },
          },
          alat: {
            select: { nama_alat: true },
          },
        },
      })

      if (overdueLoans.length === 0) {
        logger.info('No severely overdue loans found')
        return { result: 'No users to block' }
      }

      // Get unique users who aren't already blocked
      const usersToBlock = new Map<number, {
        user: typeof overdueLoans[0]['user']
        loans: typeof overdueLoans
      }>()

      for (const loan of overdueLoans) {
        if (loan.user.status_akun !== 'DIBLOKIR') {
          const key = loan.user.id_user
          if (!usersToBlock.has(key)) {
            usersToBlock.set(key, { user: loan.user, loans: [] })
          }
          usersToBlock.get(key)!.loans.push(loan)
        }
      }

      const blockedUsers: string[] = []

      for (const [userId, data] of usersToBlock) {
        const firstLoanDueDate = data.loans[0]?.tanggal_harus_kembali
        const daysOverdue = firstLoanDueDate
          ? Math.floor((Date.now() - new Date(firstLoanDueDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0

        await prisma.$transaction(async (tx) => {
          // Update user status
          await tx.users.update({
            where: { id_user: userId },
            data: { status_akun: 'DIBLOKIR' },
          })

          // Log activity
          await tx.logAktivitas.create({
            data: {
              id_user: userId,
              aktivitas: 'AUTO_BLOCK',
              detail: JSON.stringify({
                reason: 'Otomatis karena peminjaman tidak dikembalikan lebih dari ' + overdueThreshold + ' hari',
                overdue_days: daysOverdue,
                affected_loans: data.loans.map(l => ({
                  kode_peminjaman: l.kode_peminjaman,
                  nama_alat: l.alat.nama_alat,
                  tanggal_harus_kembali: l.tanggal_harus_kembali,
                })),
              }),
            },
          })
        })

        blockedUsers.push(data.user.username)
        logger.warn(`Auto-blocked user: ${data.user.nama_lengkap} (${daysOverdue} days overdue)`)
      }

      return {
        result: `Blocked ${blockedUsers.length} users`,
        users: blockedUsers,
      }
    } catch (error) {
      logger.error('auto:blacklist task error', error)
      return { result: 'Error', error: String(error) }
    }
  },
})
