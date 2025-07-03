# Code Health Report

Generated on: 2025-07-03

## File Length Analysis

This report identifies files that exceed the recommended length thresholds:

- **Hooks**: 150+ lines
- **Components**: 200+ lines
- **Utilities** (lib folder): 100+ lines
- **Types**: 200+ lines

## Files Exceeding Thresholds

Found 54 file(s) that exceed the recommended thresholds:

### Components

| File | Lines | Threshold | Excess |
|------|-------|-----------|--------|
| `components\ai-services\base-ai-service-dialog.tsx` | 485 | 200 | +285 |
| `components\clients\client-context-sidebar.tsx` | 401 | 200 | +201 |
| `components\assistant\chat-input.tsx` | 362 | 200 | +162 |
| `components\ui\consent-manager.tsx` | 343 | 200 | +143 |
| `components\ai-services\custom-document-generator-dialog.tsx` | 322 | 200 | +122 |
| `components\global\landing-page.tsx` | 287 | 200 | +87 |
| `components\ai-services\ai-services-client.tsx` | 277 | 200 | +77 |
| `components\ai-services\meeting-report-dialog.tsx` | 267 | 200 | +67 |
| `components\documents\document-list.tsx` | 265 | 200 | +65 |
| `components\clients\client-form.tsx` | 240 | 200 | +40 |
| `components\prompts\prompt-selector.tsx` | 230 | 200 | +30 |
| `components\clients\client-documents.tsx` | 213 | 200 | +13 |
| `components\ui\calendar.tsx` | 211 | 200 | +11 |
| `components\prompts\prompt-dialog.tsx` | 208 | 200 | +8 |
| `components\ui\dropdown-menu.tsx` | 202 | 200 | +2 |

### Hooks

| File | Lines | Threshold | Excess |
|------|-------|-----------|--------|
| `hooks\use-async-operation.ts` | 383 | 150 | +233 |
| `hooks\use-document-generator.ts` | 324 | 150 | +174 |
| `hooks\use-chat.ts` | 260 | 150 | +110 |
| `hooks\use-prompt-management.ts` | 258 | 150 | +108 |
| `hooks\use-document-operations.ts` | 239 | 150 | +89 |
| `hooks\use-toast.ts` | 203 | 150 | +53 |
| `hooks\use-feedback-form.ts` | 180 | 150 | +30 |
| `hooks\use-client-form.ts` | 151 | 150 | +1 |

### Utilities

| File | Lines | Threshold | Excess |
|------|-------|-----------|--------|
| `lib\database\base-operations.ts` | 362 | 100 | +262 |
| `lib\subscription-utils.ts` | 360 | 100 | +260 |
| `lib\consent-utils.ts` | 336 | 100 | +236 |
| `lib\api-middleware.ts` | 322 | 100 | +222 |
| `lib\client-logger.ts` | 258 | 100 | +158 |
| `lib\validation-helpers.ts` | 248 | 100 | +148 |
| `lib\data-export-utils.ts` | 247 | 100 | +147 |
| `lib\logger.ts` | 247 | 100 | +147 |
| `lib\actions.ts` | 243 | 100 | +143 |
| `lib\documents\service.ts` | 237 | 100 | +137 |
| `lib\models-config.ts` | 233 | 100 | +133 |
| `lib\toast-helpers.ts` | 225 | 100 | +125 |
| `lib\storage-utils.ts` | 224 | 100 | +124 |
| `lib\sample-prompts.ts` | 215 | 100 | +115 |
| `lib\usage-middleware.ts` | 182 | 100 | +82 |
| `lib\documents\repository.ts` | 180 | 100 | +80 |
| `lib\openrouter\service.ts` | 173 | 100 | +73 |
| `lib\subscription-cache.ts` | 152 | 100 | +52 |
| `lib\client-actions.ts` | 146 | 100 | +46 |
| `lib\document-save-utils.ts` | 135 | 100 | +35 |
| `lib\api-error-handler.ts` | 132 | 100 | +32 |
| `lib\documents\client-service.ts` | 125 | 100 | +25 |
| `lib\documents\storage-service.ts` | 124 | 100 | +24 |
| `lib\ai-service-api.ts` | 122 | 100 | +22 |
| `lib\ai-wrapper.ts` | 111 | 100 | +11 |
| `lib\openrouter\error-handler.ts` | 106 | 100 | +6 |
| `lib\client-middleware.ts` | 105 | 100 | +5 |

### Types

| File | Lines | Threshold | Excess |
|------|-------|-----------|--------|
| `types\database-types.ts` | 335 | 200 | +135 |
| `types\form-types.ts` | 268 | 200 | +68 |
| `types\api-types.ts` | 215 | 200 | +15 |
| `types\enums.ts` | 211 | 200 | +11 |

## Summary

- **Total files analyzed**: 142
- **Files exceeding thresholds**: 54
- **Average excess lines**: 96

## Recommendations

Consider refactoring the files listed above to improve maintainability:

- **Break down large components** into smaller, focused components
- **Extract custom hooks** from complex logic
- **Split utility files** into more specific modules
- **Organize type definitions** into logical groupings
- **Use composition patterns** to reduce file complexity

