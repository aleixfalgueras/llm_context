import { NextRequest, NextResponse } from 'next/server'
import { DocumentService } from '@/lib/documents/service'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/documents/[id] - Get document metadata
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

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
    const { id } = await params
    const updates = await request.json()

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Updates are required' },
        { status: 400 }
      )
    }

    // Validate update fields
    const allowedFields = ['documentName', 'documentType', 'content']
    const updateKeys = Object.keys(updates)
    const invalidFields = updateKeys.filter(key => !allowedFields.includes(key))
    
    if (invalidFields.length > 0) {
      return NextResponse.json(
        { error: `Invalid update fields: ${invalidFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate content if provided
    if (updates.content !== undefined) {
      if (typeof updates.content !== 'string') {
        return NextResponse.json(
          { error: 'Content must be a string' },
          { status: 400 }
        )
      }
      
      if (updates.content.length === 0) {
        return NextResponse.json(
          { error: 'Content cannot be empty' },
          { status: 400 }
        )
      }
    }

    const result = await DocumentService.updateDocument(id, updates)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to update document:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Storage limit exceeded')) {
        return NextResponse.json(
          { error: error.message },
          { status: 413 } // Payload Too Large
        )
      }
      
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    )
  }
}

// DELETE /api/documents/[id] - Delete document
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const result = await DocumentService.deleteDocument(id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to delete document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}