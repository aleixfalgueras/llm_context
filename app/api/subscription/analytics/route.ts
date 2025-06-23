import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserUsageAnalytics } from '@/lib/subscription-utils'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const analytics = await getUserUsageAnalytics(userId)
    
    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching subscription analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 