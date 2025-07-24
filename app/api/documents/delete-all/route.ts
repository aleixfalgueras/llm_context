import { DocumentService } from '@/lib/services/document-service'
import { 
  withEnhancedApi, 
  apiSuccess, 
  parseJsonBody,
  ApiContext 
} from '@/lib/middleware/api-middleware'

// DELETE /api/documents/delete-all - Delete all documents for a client
export const DELETE = withEnhancedApi(
  async ({ userId, req }: ApiContext) => {
    const { clientId } = await parseJsonBody(req)

    if (!clientId) {
      throw new Error('Client ID is required')
    }

    // Get all documents for the client
    const documentsResult = await DocumentService.getClientDocuments(userId, clientId)
    
    if (!documentsResult || !documentsResult.records || !Array.isArray(documentsResult.records) || documentsResult.records.length === 0) {
      return apiSuccess({
        message: 'No documents found for this client',
        deletedCount: 0
      })
    }

    // Extract document IDs
    const documentIds = documentsResult.records.map(doc => doc.id)

    try {
      // Delete all documents using the existing bulk delete method
      await DocumentService.bulkDeleteDocuments(userId, documentIds)

      return apiSuccess({
        message: `Successfully deleted ${documentIds.length} documents from both database and storage`,
        deletedCount: documentIds.length
      })
    } catch (error) {
      // Check if it's a storage deletion error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const isStorageError = errorMessage.includes('Storage deletion failed')
      
      throw new Error(
        isStorageError 
          ? 'Failed to delete documents from storage. Please try again or contact support if the issue persists.'
          : 'Failed to delete all documents'
      )
    }
  },
  { 
    context: 'Delete all client documents',
    allowedMethods: ['DELETE'],
    expectedContentType: 'application/json'
  }
)