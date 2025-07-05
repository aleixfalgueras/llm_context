import { NextRequest, NextResponse } from 'next/server'
import { DocumentService } from '@/lib/documents/service'

interface RouteParams {
  params: { id: string }
}

// GET /api/documents/[id] - Get document metadata
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const documentId = params.id

    // This would need to be implemented in DocumentService
    // For now, we'll return a not implemented response
    return NextResponse.json(
      { error: 'Get document metadata not implemented yet' },
      { status: 501 }
    )
  } catch (error) {
    console.error('Failed to get document:', error)
    return NextResponse.json(
      { error: 'Failed to get document' },
      { status: 500 }
    )
  }
}

// PUT /api/documents/[id] - Update document
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const documentId = params.id
    const updates = await request.json()

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Updates are required' },
        { status: 400 }
      )
    }

    const result = await DocumentService.updateDocument(documentId, updates)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to update document:', error)
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    )
  }
}

// DELETE /api/documents/[id] - Delete document
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const documentId = params.id

    const result = await DocumentService.deleteDocument(documentId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to delete document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}