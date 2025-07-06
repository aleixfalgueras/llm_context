import { NextRequest, NextResponse } from 'next/server'
import { DocumentService } from '@/lib/documents/service'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/documents/[id]/content - Get document content as JSON
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const content = await DocumentService.getDocumentContent(id)
    return NextResponse.json({ content })
  } catch (error) {
    console.error('Failed to get document content:', error)
    return NextResponse.json(
      { error: 'Failed to get document content' },
      { status: 500 }
    )
  }
}

