/**
 * Request Logging Middleware
 * Automatic request/response logging
 */

import { H3Event } from 'h3'
import { logRequest, logResponse } from '../utils/logger'

export default defineEventHandler(async (event: H3Event) => {
  // Skip non-API routes
  if (!event.path.startsWith('/api/')) {
    return
  }

  // Log request
  const startTime = Date.now()
  logRequest(event)

  // Hook into response
  event.node.res.on('finish', () => {
    const duration = Date.now() - startTime
    logResponse(event, event.node.res.statusCode, duration)
  })
})
