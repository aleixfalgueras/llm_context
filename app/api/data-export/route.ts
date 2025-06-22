import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// Create a new data export request
export async function POST() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has a pending export request
    const existingRequest = await prisma.dataExportRequest.findFirst({
      where: {
        userId,
        status: { in: ['pending', 'processing'] }
      }
    })

    if (existingRequest) {
      return NextResponse.json({
        error: 'You already have a pending export request. Please wait for it to complete.'
      }, { status: 409 })
    }

    // Create new export request
    const exportRequest = await prisma.dataExportRequest.create({
      data: {
        userId,
        requestType: 'full_export',
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      }
    })

    return NextResponse.json({
      success: true,
      requestId: exportRequest.id,
      message: 'Data export request created. You will receive an email when your export is ready.',
      estimatedTime: '24-48 hours'
    })
  } catch (error) {
    console.error('Error creating export request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get user's export requests
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const exportRequests = await prisma.dataExportRequest.findMany({
      where: { userId },
      select: {
        id: true,
        requestType: true,
        status: true,
        createdAt: true,
        completedAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10 // Last 10 requests
    })

    return NextResponse.json({ exportRequests })
  } catch (error) {
    console.error('Error fetching export requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 