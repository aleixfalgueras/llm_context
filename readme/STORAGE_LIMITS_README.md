# Storage Limits System

This document explains the storage limit system implemented to manage document storage usage across different subscription plans.

## Overview

The storage limit system ensures users don't exceed their allocated document storage space based on their subscription plan. It provides real-time checking, analytics, and error handling for storage-related operations.

## Storage Limits by Plan

- **Basic Plan**: 50 MB storage
- **Pro Plan**: 200 MB storage 
- **Business Plan**: 2 GB storage

## Architecture

### Core Components

1. **`lib/storage-utils.ts`** - Main utilities for storage management
2. **Updated document saving functions** - Integration with existing save operations
3. **API route updates** - Proper error handling for storage limits
4. **Client-side updates** - Storage information in UI components

### Key Functions

#### Storage Limit Checking
```typescript
checkStorageLimit(userId: string, documentSizeBytes: number): Promise<StorageCheckResult>
```
Checks if a user can save a document of the specified size.

#### Storage Usage Calculation
```typescript
getCurrentStorageUsage(userId: string): Promise<StorageUsage>
```
Calculates current storage usage by downloading and measuring all user documents.

#### Storage Analytics
```typescript
getStorageAnalytics(userId: string)
```
Provides formatted storage analytics including usage percentages and remaining space.

#### Document Size Calculation
```typescript
calculateDocumentSize(content: string): number
```
Calculates the byte size of document content.

#### Storage Validation Helper
```typescript
validateDocumentStorage(content: string, userId?: string): Promise<void>
```
Helper function for API routes to validate storage before saving documents.

## Integration Points

### Document Saving Functions

All document saving operations now include storage validation:

- `lib/document-save-utils.ts` - `saveDocumentToStorage()`
- `lib/document-actions.ts` - `createDocument()`

### API Routes

Updated to handle storage limit errors with proper HTTP status codes:

- `/api/ai-services/save-custom-document` - Returns 413 for storage limit exceeded
- `/api/ai-services/save-meeting-report` - Returns 413 for storage limit exceeded  
- `/api/ai-services/save-chat-export` - Returns 413 for storage limit exceeded

### Usage Information

Storage information is included in:

- `lib/usage-middleware.ts` - `getUsageInfo()` function
- `hooks/use-subscription.ts` - Client-side subscription hook
- `/api/subscription/usage-info` - API endpoint response

### Client-Side Components

Updated components to handle storage limit errors:

- `components/ai-services/custom-document-generator-dialog.tsx`
- `hooks/use-document-operations.ts`
- `components/clients/client-documents.tsx`

## Error Handling

### Server-Side Errors

Storage limit violations throw errors with descriptive messages:

```typescript
throw new Error('Storage limit exceeded. Document size: 2.5 MB, Available: 1.2 MB')
```

### HTTP Status Codes

- `413 Payload Too Large` - Returned when storage limit is exceeded
- `500 Internal Server Error` - For other storage-related errors

### Client-Side Error Display

Components display user-friendly error messages for storage limits and guide users to upgrade their plans.

## Storage Calculation Method

Storage usage is calculated by:

1. Querying all documents for a user from the database
2. Downloading each document from Supabase storage
3. Measuring the actual file size in bytes
4. Aggregating total usage and usage per client

> **Note**: In a high-performance production system, you might want to store file sizes in the database to avoid downloading files for size calculation.

## Performance Considerations

- Storage calculations are cached where possible
- Parallel database calls minimize latency
- Error handling ensures graceful degradation
- File size calculations are done on-demand

## Subscription Plan Updates

The subscription plan feature lists now include storage information:

- Basic: "💾 50 MB document storage"
- Pro: "💾 200 MB document storage"  
- Business: "💾 2 GB document storage"

## Usage Analytics

The storage system provides:

- Total storage used (bytes and formatted)
- Storage limit (bytes and formatted)
- Usage percentage
- Remaining storage (bytes and formatted)
- Per-client storage breakdown

## Future Enhancements

Potential improvements could include:

1. **Database file size tracking** - Store file sizes in database for faster calculations
2. **Storage compression** - Implement document compression to maximize storage efficiency
3. **Automated cleanup** - Archive or compress old documents automatically
4. **Storage warnings** - Notify users when approaching limits (80% threshold is already implemented)
5. **Bulk upload limits** - Implement limits for multiple file uploads

## Testing

The storage system includes comprehensive validation:

- Storage limit calculation accuracy
- Document size measurement precision
- Error handling robustness
- Integration with existing workflows

Storage limits are enforced consistently across all document creation paths to ensure users stay within their allocated storage space. 