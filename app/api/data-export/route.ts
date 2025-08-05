import { prisma } from '@/lib/prisma'
import { withEnhancedApi, apiSuccess } from '@/lib/api/api-middleware'
import { ApiErrors } from '@/lib/api/api-error-handler'

// Create a new data export request
export const POST = withEnhancedApi(async ({ userId }) => {
  // Check if user has a pending export request
  const existingRequest = await prisma.dataExportRequest.findFirst({
    where: {
      userId,
      status: { in: ['pending', 'processing'] }
    }
  })

  if (existingRequest) {
    return ApiErrors.conflict('You already have a pending export request. Please wait for it to complete.')
  }

  // Create new export request
  const exportRequest = await prisma.dataExportRequest.create({
    data: {
      userId,
      requestType: 'full_export',
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    }
  })

  return apiSuccess({
    requestId: exportRequest.id,
    message: 'Data export request created. You will receive an email when your export is ready.',
    estimatedTime: '24-48 hours'
  }, 201)
}, {
  context: 'Create data export request',
  allowedMethods: ['POST']
})

// Get user's export requests
export const GET = withEnhancedApi(async ({ userId }) => {
  const exportRequests = await prisma.dataExportRequest.findMany({
    where: { userId },
    select: {
      id: true,
      requestType: true,
      status: true,
      createdAt: true,
      completedAt: true,
      expiresAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10 // Last 10 requests
  })

  return apiSuccess({ exportRequests })
}, {
  context: 'Get data export requests',
  allowedMethods: ['GET']
}) 