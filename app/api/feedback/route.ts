import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the current user information
    const user = await currentUser()
    const userName = user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || 'Anonymous'
    const userEmail = user?.emailAddresses[0]?.emailAddress

    const { title, description, priority, useCase } = await request.json()

    // Validate required fields
    if (!title || !description || !priority) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    // Validate priority values
    const validPriorities = ['low', 'medium', 'high']
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority value' }, 
        { status: 400 }
      )
    }

    // Save feature request to database
    const feedback = await prisma.feedback.create({
      data: {
        userId,
        userEmail,
        userName,
        title,
        description,
        priority,
        useCase: useCase || null,
      }
    })

    return NextResponse.json({ 
      success: true, 
      featureRequestId: feedback.id,
      message: 'Feature request submitted successfully'
    })

  } catch (error) {
    console.error('Feature request submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get feature requests for the current user
    const featureRequests = await prisma.feedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ featureRequests })

  } catch (error) {
    console.error('Feature requests retrieval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
} 