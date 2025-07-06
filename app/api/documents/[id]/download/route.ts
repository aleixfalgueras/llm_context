import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { DocumentService } from '@/lib/documents/service'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/documents/[id]/download - Download document as file
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get the document from database to verify ownership and get name
    const document = await prisma.document.findFirst({
      where: { 
        id,
        userId 
      }
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found or unauthorized' }, 
        { status: 404 }
      )
    }

    // Get document content
    const documentContent = await DocumentService.getDocumentContent(id)

    // Return markdown file as a blob for download
    return new NextResponse(documentContent, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${document.documentName}.md"`,
      },
    })

  } catch (error) {
    console.error('Document download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

