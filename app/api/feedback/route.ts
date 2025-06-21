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

    const { type, title, description, priority, useCase, stepsToReproduce } = await request.json()

    // Validate required fields
    if (!type || !title || !description || !priority) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    // Validate feedback type
    const validTypes = ['feature', 'bug', 'complaint']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' }, 
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

    // Save feedback to database
    const feedback = await prisma.feedback.create({
      data: {
        userId,
        userEmail,
        userName,
        type,
        title,
        description,
        priority,
        useCase: useCase || null,
        stepsToReproduce: stepsToReproduce || null,
      }
    })

    const feedbackTypeLabel = type === 'feature' ? 'feature request' : 
                             type === 'bug' ? 'bug report' : 'feedback'

    return NextResponse.json({ 
      success: true, 
      feedbackId: feedback.id,
      message: `${feedbackTypeLabel.charAt(0).toUpperCase() + feedbackTypeLabel.slice(1)} submitted successfully`
    })

  } catch (error) {
    console.error('Feedback submission error:', error)
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

    // Get feedback for the current user
    const feedbacks = await prisma.feedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ feedbacks })

  } catch (error) {
    console.error('Feedback retrieval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
} 