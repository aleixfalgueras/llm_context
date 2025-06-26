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
  clientId: string,
  options: ClientAccessOptions = {}
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
  clientId: string,
  clientOptions: ClientAccessOptions = {}
): Promise<{
  success: boolean
  userId?: string
  client?: any
  response?: Response
}> {
  // Import here to avoid circular dependencies
  const { withAuthAndUsageCheck } = await import('./api-middleware')
  
  // First check auth and usage
  const authCheck = await withAuthAndUsageCheck(action)
  
  if (!authCheck.success) {
    return {
      success: false,
      response: authCheck.response
    }
  }

  // Then check client access
  const clientCheck = await withClientAccess(authCheck.userId!, clientId, clientOptions)
  
  if (!clientCheck.success) {
    return {
      success: false,
      response: clientCheck.response
    }
  }

  return {
    success: true,
    userId: authCheck.userId,
    client: clientCheck.client
  }
} 