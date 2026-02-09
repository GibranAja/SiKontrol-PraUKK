/**
 * Server Plugin: Scheduler
 * Initializes scheduled tasks for automated processes
 */

import prisma from '~~/server/utils/prisma'
import { logger } from '~~/server/utils/logger'

export default defineNitroPlugin((nitroApp) => {
  logger.info('Scheduler plugin initialized')

  // Note: In production, use proper task scheduler from nuxt.config.ts
  // This plugin handles initialization and cleanup

  nitroApp.hooks.hook('close', async () => {
    // Cleanup on server shutdown
    await prisma.$disconnect()
    logger.info('Database connection closed')
  })
})
