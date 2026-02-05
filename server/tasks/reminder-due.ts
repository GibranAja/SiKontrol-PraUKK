/**
 * Scheduled Task: Reminder Due
 * Runs daily at 08:00 to send reminders for loans due today/tomorrow
 *
 * To enable in nuxt.config.ts:
 * experimental: {
 *   tasks: true
 * },
 * scheduledTasks: {
 *   '0 8 * * *': ['reminder:due']
 * }
 */

import prisma from '~~/server/utils/prisma'
import { consoleLog } from '~~/server/utils/logger'

export default defineTask({
  meta: {
    name: 'reminder:due',
    description: 'Send reminders for loans due today or tomorrow',
  },
  async run() {
    consoleLog('info', 'Running reminder:due task')

    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(23, 59, 59, 999)

      // Find loans due today or tomorrow that are still active
      const dueSoon = await prisma.peminjaman.findMany({
        where: {
          status_peminjaman: 'DIPINJAM',
          tanggal_harus_kembali: {
            gte: today,
            lte: tomorrow,
          },
        },
        include: {
          user: {
            select: {
              id_user: true,
              username: true,
              nama_lengkap: true,
              email: true,
            },
          },
          alat: {
            select: {
              nama_alat: true,
            },
          },
        },
      })

      if (dueSoon.length === 0) {
        consoleLog('info', 'No loans due soon')
        return { result: 'No loans due soon' }
      }

      // TODO: Implement actual notification system (email, push, etc.)
      // For now, just log the reminders
      for (const loan of dueSoon) {
        const dueDate = loan.tanggal_harus_kembali
        const isToday = dueDate && dueDate.toDateString() === today.toDateString()

        consoleLog('info', `Reminder: Loan ${loan.kode_peminjaman} for ${loan.user.nama_lengkap}`)
        consoleLog('info', `  - Alat: ${loan.alat.nama_alat}`)
        consoleLog('info', `  - Due: ${isToday ? 'TODAY' : 'TOMORROW'}`)

        // Log activity
        await prisma.logAktivitas.create({
          data: {
            id_user: loan.user.id_user,
            aksi: 'REMINDER_DUE_DATE',
            tabel_terkait: 'peminjaman',
            id_referensi: loan.id_peminjaman,
            detail: JSON.stringify({
              kode_peminjaman: loan.kode_peminjaman,
              nama_alat: loan.alat.nama_alat,
              tanggal_harus_kembali: dueDate,
              reminder_type: isToday ? 'due_today' : 'due_tomorrow',
            }),
          },
        })
      }

      return {
        result: `Sent ${dueSoon.length} reminders`,
        loans: dueSoon.map(l => l.kode_peminjaman),
      }
    } catch (error) {
      consoleLog('error', 'reminder:due task error', error)
      return { result: 'Error', error: String(error) }
    }
  },
})
