import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getDocumentContent } from '@/lib/document-actions'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentId } = await request.json()

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' }, 
        { status: 400 }
      )
    }

    // Get the document to verify ownership and get file path
    const document = await prisma.document.findFirst({
      where: { 
        id: documentId,
        userId 
      }
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found or unauthorized' }, 
        { status: 404 }
      )
    }

    // Get document content using the server action
    const content = await getDocumentContent(document.documentPath)

    return NextResponse.json({ content })

  } catch (error) {
    console.error('Document content error:', error)
    return NextResponse.json(
      { error: 'Failed to get document content' }, 
      { status: 500 }
    )
  }
} 