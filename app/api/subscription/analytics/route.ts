import {
  withEnhancedApi, 
  apiSuccess,
  ApiContext 
} from '@/lib/middleware/api-middleware'
import {getUserUsageAnalytics} from "@/lib/subscription/subscription-usage";

// Force dynamic rendering since we use auth() which accesses headers
export const dynamic = 'force-dynamic'

export const GET = withEnhancedApi(
  async ({ userId }: ApiContext) => {
    const analytics = await getUserUsageAnalytics(userId)
    return apiSuccess(analytics)
  },
  { 
    context: 'Get subscription analytics',
    allowedMethods: ['GET']
  }
) 