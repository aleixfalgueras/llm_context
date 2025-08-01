import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DocumentService } from '@/services/document-service'
import { 
  withEnhancedApi,
  ApiContext 
} from '@/lib/middleware/api-middleware'

// GET /api/documents/[id]/download - Download document as file
export const GET = withEnhancedApi(
  async ({ userId, params }: ApiContext) => {
    const { id } = params!
    const documentId = id as string

    // Get the document from database to verify ownership and get name
    const document = await prisma.document.findFirst({
      where: { 
        id: documentId,
        userId 
      }
    })

    if (!document) {
      const error = new Error('Document not found or unauthorized')
      ;(error as any).status = 404
      throw error
    }

    // Get document content
    const documentContent = await DocumentService.getDocumentContent(userId, documentId)

    // Return markdown file as a blob for download
    return new NextResponse(documentContent, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${document.documentName}.md"`,
      },
    })
  },
  { 
    context: 'Download document',
    allowedMethods: ['GET']
  }
)

