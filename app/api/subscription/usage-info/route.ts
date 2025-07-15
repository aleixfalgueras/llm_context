import { getUsageInfo } from '@/lib/middleware/api-middleware'
import { 
  withEnhancedApi, 
  apiSuccess,
  ApiContext 
} from '@/lib/middleware/api-middleware'

// Force dynamic rendering since we use auth() which accesses headers
export const dynamic = 'force-dynamic'

export const GET = withEnhancedApi(
  async ({ userId }: ApiContext) => {
    const usageInfo = await getUsageInfo(userId)
    
    if (!usageInfo) {
      const error = new Error('Failed to fetch usage information')
      ;(error as any).status = 500
      throw error
    }
    
    return apiSuccess(usageInfo)
  },
  { 
    context: 'Get usage info',
    allowedMethods: ['GET']
  }
) 