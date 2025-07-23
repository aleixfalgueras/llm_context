import { DocumentService } from '@/lib/documents/service'
import { 
  withEnhancedApi, 
  apiSuccess, 
  parseJsonBody,
  ApiContext 
} from '@/lib/middleware/api-middleware'

// PUT /api/documents/[id] - Update document
export const PUT = withEnhancedApi(
  async ({ userId, req, params }: ApiContext) => {
    const { id } = params!
    const documentId = id as string
    const updates = await parseJsonBody(req)

    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('Updates are required')
    }

    // Validate update fields
    const allowedFields = ['documentName', 'documentType', 'content']
    const updateKeys = Object.keys(updates)
    const invalidFields = updateKeys.filter(key => !allowedFields.includes(key))
    
    if (invalidFields.length > 0) {
      throw new Error(`Invalid update fields: ${invalidFields.join(', ')}`)
    }

    // Validate content if provided
    if (updates.content !== undefined) {
      if (typeof updates.content !== 'string') {
        throw new Error('Content must be a string')
      }
      
      if (updates.content.length === 0) {
        throw new Error('Content cannot be empty')
      }
    }

    try {
      const result = await DocumentService.updateDocument(userId, documentId, updates)
      return apiSuccess(result)
    } catch (error) {
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('Storage limit exceeded')) {
          const storageError = new Error(error.message)
          ;(storageError as any).status = 413
          throw storageError
        }
        
        if (error.message.includes('not found')) {
          const notFoundError = new Error('Document not found')
          ;(notFoundError as any).status = 404
          throw notFoundError
        }
      }
      throw error
    }
  },
  { 
    context: 'Update document',
    allowedMethods: ['PUT'],
    expectedContentType: 'application/json'
  }
)

// DELETE /api/documents/[id] - Delete document
export const DELETE = withEnhancedApi(
  async ({ userId, params }: ApiContext) => {
    const { id } = params!
    const documentId = id as string

    const result = await DocumentService.deleteDocument(userId, documentId)
    return apiSuccess(result)
  },
  { 
    context: 'Delete document',
    allowedMethods: ['DELETE']
  }
)