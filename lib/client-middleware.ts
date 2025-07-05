import { prisma } from './prisma'

export interface ClientAccessOptions {
  // Context building is now handled in individual services
  // Removed buildContext, contextType, includeNotes, additionalInstructions
}

export interface ClientAccessResult {
  success: boolean
  client?: any
  response?: Response
}

/**
 * Unified middleware for client access validation
 * Eliminates the repeated client fetching pattern across all APIs
 */
export async function withClientAccess(
  userId: string,
  clientId: string
): Promise<ClientAccessResult> {
  try {
    // Fetch and validate client belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId,
      },
    })

    if (!client) {
      return {
        success: false,
        response: new Response('Client not found', { status: 404 })
      }
    }

    return {
      success: true,
      client
    }
  } catch (error) {
    console.error('Error in client access middleware:', error)
    return {
      success: false,
      response: new Response('Internal Server Error', { status: 500 })
    }
  }
}

/**
 * Enhanced API middleware that combines auth, usage, and client access
 * Perfect for AI service APIs that need client data
 */
export async function withAuthUsageAndClient(
  action: 'document' | 'client',
  clientId: string
): Promise<{
  success: boolean
  userId?: string
  client?: any
  response?: Response
}> {
  // Import here to avoid circular dependencies
  const { auth } = await import('@clerk/nextjs/server')
  
  // Check authentication only (no usage limits for documents)
  const { userId } = await auth()
  
  if (!userId) {
    return {
      success: false,
      response: new Response('Unauthorized', { status: 401 })
    }
  }

  // Check usage limits only for client actions (not documents)
  if (action === 'client') {
    const { withAuthAndUsageCheck } = await import('./api-middleware')
    const authCheck = await withAuthAndUsageCheck(action)
    
    if (!authCheck.success) {
      return {
        success: false,
        response: authCheck.response
      }
    }
  }

  // Check client access
  const clientCheck = await withClientAccess(userId, clientId)
  
  if (!clientCheck.success) {
    return {
      success: false,
      response: clientCheck.response
    }
  }

  return {
    success: true,
    userId: userId,
    client: clientCheck.client
  }
} 