import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { logger } from '@/lib/logger'

const isPublicRoute = createRouteMatcher([
  '/', 
  '/sign-in(.*)', 
  '/sign-up(.*)',
  '/terms',
  '/privacy',
  '/api/subscription/webhook'
])

// Note: /admin is NOT public - it requires authentication and email verification

export default clerkMiddleware(async (auth, request) => {
  const url = new URL(request.url)


  if (!isPublicRoute(request)) {
    try {
    await auth.protect()
      // Removed authentication successful log to reduce noise
    } catch (error) {
      logger.warn('🚫 Authentication failed', { 
        operation: `${request.method} ${url.pathname}`,
        metadata: { error: (error as Error).message }
      });
      throw error;
    }
  }

  // Removed middleware completed log to reduce noise
})

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and WordPress admin paths
    '/((?!_next|wordpress|wp-admin|wp-content|wp-includes|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
} 