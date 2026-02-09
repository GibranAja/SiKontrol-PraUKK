/**
 * PATCH /api/users/change-password
 * Change own password (authenticated users)
 */

import { createError } from 'h3'
import bcrypt from 'bcryptjs'
import prisma from '~~/server/utils/prisma'
import { changePasswordSchema } from '~~/server/utils/validators'
import { formatResponse, formatErrorResponse } from '~~/server/utils/helpers'
import { logActivityFromEvent } from '~~/server/utils/logger'
import { AktivitasType } from '~~/server/utils/enums'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user

    if (!user) {
      throw createError({
        statusCode: 401,
        data: formatErrorResponse('UNAUTHORIZED', 'Silakan login terlebih dahulu'),
      })
    }

    // Parse and validate body
    const body = await readBody(event)
    const validation = changePasswordSchema.safeParse(body)

    if (!validation.success) {
      // ✅ FIX ERROR 1: Format error yang benar
      throw createError({
        statusCode: 400,
        data: formatErrorResponse(
          'VALIDATION_ERROR',
          'Data tidak valid'
        ),
      })
    }

    // ✅ FIX ERROR 2: Hapus old_password
    const { new_password, confirm_password } = validation.data

    // Check if new password matches confirmation
    if (new_password !== confirm_password) {
      throw createError({
        statusCode: 400,
        data: formatErrorResponse('VALIDATION_ERROR', 'Password baru dan konfirmasi tidak cocok'),
      })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 12)

    // Update password
    await prisma.users.update({
      where: { id_user: user.id_user },
      data: { password: hashedPassword },
    })

    // ✅ FIX ERROR 3: Format log yang benar (string, bukan object)
    await logActivityFromEvent(
      event,
      AktivitasType.CHANGE_PASSWORD,
      `User ${user.username} mengubah password`
    )

    return formatResponse(null, undefined, 'Password berhasil diubah')
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Error changing password:', error)
    throw createError({
      statusCode: 500,
      data: formatErrorResponse('INTERNAL_ERROR', 'Terjadi kesalahan saat mengubah password'),
    })
  }
})
