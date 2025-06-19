import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getDocumentContent } from '@/lib/document-actions'
import { generatePdfFromMarkdown } from '@/lib/pdf-generator'

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

    // Get the document from database to verify ownership
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

    // Get document content
    const documentContent = await getDocumentContent(document.documentPath)

    // Generate PDF using shared utility function
    const pdf = await generatePdfFromMarkdown(documentContent)

    // Return PDF as a blob for download
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${document.documentName}.pdf"`,
      },
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
} 