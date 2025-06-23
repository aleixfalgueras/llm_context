import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUsageInfo } from '@/lib/usage-middleware'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const usageInfo = await getUsageInfo(userId)
    
    if (!usageInfo) {
      return NextResponse.json(
        { error: 'Failed to fetch usage information' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(usageInfo)
  } catch (error) {
    console.error('Error fetching usage info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 