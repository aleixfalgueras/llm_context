import { NextResponse } from 'next/server'
import { DocumentService } from '@/services/document-service'
import { 
  withEnhancedApi,
  ApiContext 
} from '@/lib/api/api-middleware'

// GET /api/documents/[id]/download - Download document as file
export const GET = withEnhancedApi(
  async ({ userId, params }: ApiContext) => {
    const { id } = params!
    const documentId = id as string

    // Get the document from database to verify ownership and get name
    const document = await DocumentService.getDocumentMetadata(userId, documentId)

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

