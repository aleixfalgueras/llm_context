import { auth } from '@clerk/nextjs/server'

/**
 * Shared authentication middleware that ensures user is authenticated
 * @returns The authenticated userId
 * @throws Error if user is not authenticated
 */
export async function requireAuth(): Promise<string> {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }
  
  return userId
}

/**
 * Creates a standardized unauthorized response
 * @returns Response with 401 status
 */
export function createUnauthorizedResponse(): Response {
  return new Response('Unauthorized', { status: 401 })
}

/**
 * Creates a standardized client not found response
 * @returns Response with 404 status
 */
export function createClientNotFoundResponse(): Response {
  return new Response('Client not found', { status: 404 })
}

/**
 * Creates a standardized missing fields response
 * @returns Response with 400 status
 */
export function createMissingFieldsResponse(): Response {
  return new Response('Missing required fields', { status: 400 })
}

/**
 * Wrapper for API routes that handles authentication automatically
 * @param handler The API route handler function
 * @returns Wrapped handler with authentication
 */
export function withAuth<T extends any[]>(
  handler: (userId: string, ...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      const userId = await requireAuth()
      return await handler(userId, ...args)
    } catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized') {
        return createUnauthorizedResponse()
      }
      throw error
    }
  }
} 