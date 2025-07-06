import { NextRequest, NextResponse } from 'next/server'
import { DocumentService } from '@/lib/documents/service'
import { auth } from '@clerk/nextjs/server'

// DELETE /api/documents/delete-all - Delete all documents for a client
export async function DELETE(request: NextRequest) {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await request.json()

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Get all documents for the client
    const documentsResult = await DocumentService.getClientDocuments(clientId)
    
    if (!documentsResult || !documentsResult.records || !Array.isArray(documentsResult.records) || documentsResult.records.length === 0) {
      return NextResponse.json(
        { message: 'No documents found for this client' },
        { status: 200 }
      )
    }

    // Extract document IDs
    const documentIds = documentsResult.records.map(doc => doc.id)

    // Delete all documents using the existing bulk delete method
    await DocumentService.bulkDeleteDocuments(documentIds)

    return NextResponse.json({
      message: `Successfully deleted ${documentIds.length} documents from both database and storage`,
      deletedCount: documentIds.length
    })
  } catch (error) {
    console.error('Failed to delete all documents:', error)
    
    // Check if it's a storage deletion error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isStorageError = errorMessage.includes('Storage deletion failed')
    
    return NextResponse.json(
      { 
        error: isStorageError 
          ? 'Failed to delete documents from storage. Please try again or contact support if the issue persists.'
          : 'Failed to delete all documents'
      },
      { status: 500 }
    )
  }
}