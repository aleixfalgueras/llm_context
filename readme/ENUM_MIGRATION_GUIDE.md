# Enum Migration Guide

This document outlines the migration from hardcoded string literals to proper TypeScript enums throughout the LLM Context application. This refactoring improves type safety, maintainability, and reduces the risk of typos.

## Overview

We've identified and consolidated repeated string literals into centralized enum definitions located in `types/enums.ts`. This file serves as the single source of truth for all enumerated values used across the application.

## Migrated Enums

### 1. Request Status (`RequestStatus`)

**Before:**
```typescript
status: 'pending'
status: 'processing'
status: 'completed'
status: 'failed'
status: 'cancelled'
```

**After:**
```typescript
import { RequestStatus } from '@/types/enums'

status: RequestStatus.PENDING
status: RequestStatus.PROCESSING
status: RequestStatus.COMPLETED
status: RequestStatus.FAILED
status: RequestStatus.CANCELLED
```

**Usage:** Data export requests, account deletion processes

### 2. Feedback System (`FeedbackType`, `Priority`)

**Before:**
```typescript
const validTypes = ['feature', 'bug', 'complaint']
const priorities = [
  { value: 'low', label: 'Low Priority - Minor issue' },
  { value: 'medium', label: 'Medium Priority - Moderate impact' },
  { value: 'high', label: 'High Priority - Major issue' }
]
```

**After:**
```typescript
import { FeedbackType, Priority, FEEDBACK_TYPE_LABELS, PRIORITY_LABELS } from '@/types/enums'

// Validation
if (!isValidFeedbackType(type)) { /* handle error */ }

// Usage in components
const feedbackTypes = FEEDBACK_TYPE_VALUES.map(type => ({
  value: type,
  label: FEEDBACK_TYPE_LABELS[type],
  description: FEEDBACK_TYPE_DESCRIPTIONS[type]
}))
```

**Files Updated:**
- `components/global/feedback-form.tsx`
- `app/api/feedback/route.ts`
- `app/admin/page.tsx`

### 3. Consent Management (`ConsentAction`, `ConsentType`)

**Before:**
```typescript
action: 'granted'
action: 'withdrawn'
consentType: 'data_processing'
consentType: 'analytics'
```

**After:**
```typescript
import { ConsentAction, ConsentType } from '@/types/enums'

action: ConsentAction.GRANTED
action: ConsentAction.WITHDRAWN
consentType: ConsentType.DATA_PROCESSING
consentType: ConsentType.ANALYTICS
```

**Files Updated:**
- `lib/consent-utils.ts`

### 4. UI Component Variants

**Before:**
```typescript
variant: 'destructive'
variant: 'default'
variant: 'secondary'
```

**After:**
```typescript
import { ToastVariant, ButtonVariant, BadgeVariant } from '@/types/enums'

variant: ToastVariant.DESTRUCTIVE
variant: ButtonVariant.DEFAULT
variant: BadgeVariant.SECONDARY
```

**Files Updated:**
- `components/global/feedback-form.tsx`
- `app/admin/page.tsx`
- Various hook files

### 5. Language Support (`Language`)

**Before:**
```typescript
const languages = [
  { value: 'english', label: 'English', flag: '🇺🇸' },
  { value: 'spanish', label: 'Spanish (Español)', flag: '🇪🇸' },
  // ... repeated in multiple files
]
```

**After:**
```typescript
import { Language, LANGUAGE_INFO } from '@/types/enums'

const getLanguageInfo = (languageValue: string) => {
  const langKey = languageValue as Language
  const info = LANGUAGE_INFO[langKey]
  return info ? { value: languageValue, label: info.label, flag: info.flag } : 
                { value: Language.ENGLISH, label: LANGUAGE_INFO[Language.ENGLISH].label, flag: LANGUAGE_INFO[Language.ENGLISH].flag }
}
```

**Files Updated:**
- `lib/language-utils.ts`
- `components/clients/client-form.tsx`
- `components/clients/clients-list.tsx`

### 6. Service Status (`ServiceStatus`)

**Before:**
```typescript
status: 'available'
service.status === 'available'
```

**After:**
```typescript
import { ServiceStatus } from '@/types/enums'

status: ServiceStatus.AVAILABLE
service.status === ServiceStatus.AVAILABLE
```

**Files Updated:**
- `components/ai-services/ai-services-client.tsx`

### 7. View Mode (`ViewMode`)

**Before:**
```typescript
const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
```

**After:**
```typescript
import { ViewMode } from '@/types/enums'

const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID)
```

**Files Updated:**
- `components/clients/clients-list.tsx`

## Key Features of the Enum System

### 1. Validation Functions
```typescript
export function isValidRequestStatus(status: string): status is RequestStatusType {
  return Object.values(RequestStatus).includes(status as RequestStatus)
}

export function isValidFeedbackType(type: string): type is FeedbackTypeType {
  return Object.values(FeedbackType).includes(type as FeedbackType)
}
```

### 2. Display Labels and Descriptions
```typescript
export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  [FeedbackType.FEATURE]: 'Feature Request',
  [FeedbackType.BUG]: 'Bug Report',
  [FeedbackType.COMPLAINT]: 'General Feedback'
}

export const LANGUAGE_INFO: Record<Language, { label: string; flag: string }> = {
  [Language.ENGLISH]: { label: 'English', flag: '🇺🇸' },
  [Language.SPANISH]: { label: 'Spanish (Español)', flag: '🇪🇸' },
  // ...
}
```

### 3. Backward Compatibility Types
```typescript
export type RequestStatusType = `${RequestStatus}`
export type FeedbackTypeType = `${FeedbackType}`
export type LanguageType = `${Language}`
```

### 4. Utility Arrays for Iteration
```typescript
export const REQUEST_STATUS_VALUES = Object.values(RequestStatus)
export const FEEDBACK_TYPE_VALUES = Object.values(FeedbackType)
export const LANGUAGE_VALUES = Object.values(Language)
```

## Benefits Achieved

### 1. **Type Safety**
- Compile-time checking prevents invalid values
- IDE autocomplete suggests valid enum values
- Reduces runtime errors from typos

### 2. **Maintainability**
- Single source of truth for all enumerated values
- Easy to add new values or update existing ones
- Consistent naming across the application

### 3. **Developer Experience**
- IntelliSense support for enum values
- Refactoring tools work better with enums
- Clear intent and documentation

### 4. **Consistency**
- Eliminates duplicate definitions across files
- Ensures consistent casing and naming
- Prevents drift between similar definitions

## Usage Guidelines

### 1. Import Pattern
```typescript
// Import specific enums and utilities you need
import { 
  FeedbackType, 
  Priority, 
  ToastVariant,
  FEEDBACK_TYPE_LABELS,
  isValidFeedbackType 
} from '@/types/enums'
```

### 2. Validation Pattern
```typescript
// Always validate external input
if (!isValidFeedbackType(userInput)) {
  throw new Error('Invalid feedback type')
}
```

### 3. Component Pattern
```typescript
// Use enum values in components
<Button variant={ButtonVariant.DESTRUCTIVE}>
  Delete
</Button>
```

### 4. API Pattern
```typescript
// Use validation functions in API routes
if (!isValidPriority(priority)) {
  return NextResponse.json(
    { error: 'Invalid priority value' }, 
    { status: 400 }
  )
}
```

## Future Considerations

1. **Adding New Values**: Simply add to the enum and update associated label/description objects
2. **Breaking Changes**: Use the utility types for gradual migration
3. **Database Integration**: Consider using enum constraints in database schema
4. **API Documentation**: Enums can be automatically documented in OpenAPI specs

## Files Modified

### Core Enum Definition
- `types/enums.ts` (new file)

### Components
- `components/global/feedback-form.tsx`
- `components/ai-services/ai-services-client.tsx` 
- `components/clients/clients-list.tsx`
- `app/admin/page.tsx`

### API Routes
- `app/api/feedback/route.ts`

### Utilities
- `lib/consent-utils.ts`
- `lib/language-utils.ts`

### Hooks
- `hooks/use-document-operations.ts` (partial)

This enum migration significantly improves the codebase's type safety and maintainability while providing a foundation for future enhancements. 