import { NextRequest, NextResponse } from 'next/server'
import { DocumentService } from '@/lib/documents/service'

// DELETE /api/documents/delete-all - Delete all documents for a client
export async function DELETE(request: NextRequest) {
  try {
    const { clientId } = await request.json()

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Get all documents for the client
    const documentsResult = await DocumentService.getClientDocuments(clientId)
    
    if (!documentsResult || !Array.isArray(documentsResult) || documentsResult.length === 0) {
      return NextResponse.json(
        { message: 'No documents found for this client' },
        { status: 200 }
      )
    }

    // Extract document IDs
    const documentIds = documentsResult.map(doc => doc.id)

    // Delete all documents using the existing bulk delete method
    await DocumentService.bulkDeleteDocuments(documentIds)

    return NextResponse.json({
      message: `Successfully deleted ${documentIds.length} documents`,
      deletedCount: documentIds.length
    })
  } catch (error) {
    console.error('Failed to delete all documents:', error)
    return NextResponse.json(
      { error: 'Failed to delete all documents' },
      { status: 500 }
    )
  }
}