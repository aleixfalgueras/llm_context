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

## Code Quality Analysis

Found 6602 code quality issue(s) across the codebase:

### Duplicate Code (5956 issues)

| File | Line | Description |
|------|------|-------------|
| `app/admin/page.tsx` | 14 | Duplicate code block found (2 occurrences) |
| `app/admin/page.tsx` | 15 | Duplicate code block found (2 occurrences) |
| `app/admin/page.tsx` | 19 | Duplicate code block found (2 occurrences) |
| `app/admin/page.tsx` | 20 | Duplicate code block found (2 occurrences) |
| `app/admin/page.tsx` | 23 | Duplicate code block found (2 occurrences) |
| `app/admin/page.tsx` | 106 | Duplicate code block found (2 occurrences) |
| `app/admin/page.tsx` | 24 | Duplicate code block found (2 occurrences) |
| `app/admin/page.tsx` | 107 | Duplicate code block found (2 occurrences) |
| `app/admin/page.tsx` | 25 | Duplicate code block found (2 occurrences) |
| `app/admin/page.tsx` | 108 | Duplicate code block found (2 occurrences) |
| ... | ... | 5946 more issues |

### Unused Imports (16 issues)

| File | Line | Description |
|------|------|-------------|
| `app/api/ai-services/save-custom-document/route.ts` | 9 | Import 'ApiErrors' appears to be unused |
| `app/api/feedback/route.ts` | 1 | Import 'NextRequest' appears to be unused |
| `app/api/prompts/route.ts` | 1 | Import 'NextRequest' appears to be unused |
| `components/documents/document-creation-form.tsx` | 11 | Import 'type DocumentType' appears to be unused |
| `components/documents/document-list.tsx` | 10 | Import 'type DocumentType' appears to be unused |
| `components/documents/document-viewer.tsx` | 8 | Import 'type DocumentType' appears to be unused |
| `components/ui/alert.tsx` | 2 | Import 'type VariantProps' appears to be unused |
| `components/ui/badge.tsx` | 2 | Import 'type VariantProps' appears to be unused |
| `components/ui/button.tsx` | 3 | Import 'type VariantProps' appears to be unused |
| `components/ui/command.tsx` | 4 | Import 'type DialogProps' appears to be unused |
| ... | ... | 6 more issues |

### Dead Code (298 issues)

| File | Line | Severity | Description |
|------|------|----------|-------------|
| `app/admin/page.tsx` | 106 | 🔴 high | Unreachable code after return statement |
| `app/admin/page.tsx` | 139 | 🔴 high | Unreachable code after return statement |
| `app/ai-services/page.tsx` | 18 | 🔴 high | Unreachable code after return statement |
| `app/api/account/delete/route.ts` | 20 | 🔴 high | Unreachable code after return statement |
| `app/api/account/delete/route.ts` | 91 | 🔴 high | Unreachable code after return statement |
| `app/api/account/delete/route.ts` | 127 | 🔴 high | Unreachable code after return statement |
| `app/api/account/delete/route.ts` | 134 | 🔴 high | Unreachable code after return statement |
| `app/api/account/delete/route.ts` | 162 | 🔴 high | Unreachable code after return statement |
| `app/api/account/process-deletion/route.ts` | 33 | 🔴 high | Unreachable code after return statement |
| `app/api/account/process-deletion/route.ts` | 74 | 🔴 high | Unreachable code after return statement |
| ... | ... | ... | 288 more issues |

### Magic Numbers (332 issues)

| File | Line | Column | Description |
|------|------|--------|-------------|
| `app/admin/page.tsx` | 91 | 38 | Magic number '30' should be replaced with a named constant |
| `app/admin/page.tsx` | 91 | 43 | Magic number '24' should be replaced with a named constant |
| `app/admin/page.tsx` | 91 | 48 | Magic number '60' should be replaced with a named constant |
| `app/admin/page.tsx` | 91 | 48 | Magic number '60' should be replaced with a named constant |
| `app/admin/page.tsx` | 159 | 45 | Magic number '30' should be replaced with a named constant |
| `app/api/account/delete/route.ts` | 12 | 69 | Magic number '401' should be replaced with a named constant |
| `app/api/account/delete/route.ts` | 21 | 20 | Magic number '400' should be replaced with a named constant |
| `app/api/account/delete/route.ts` | 67 | 55 | Magic number '7' should be replaced with a named constant |
| `app/api/account/delete/route.ts` | 67 | 59 | Magic number '24' should be replaced with a named constant |
| `app/api/account/delete/route.ts` | 67 | 64 | Magic number '60' should be replaced with a named constant |
| ... | ... | ... | 322 more issues |

### Code Quality Summary

- **Duplicate Code**: 5956 issues
- **Unused Imports**: 16 issues
- **Dead Code**: 298 issues
- **Magic Numbers**: 332 issues

### Code Quality Recommendations

- **Extract duplicate code** into reusable functions or components
- **Remove unused imports** to improve bundle size and code clarity
- **Eliminate dead code** to reduce maintenance burden
- **Replace magic numbers** with named constants for better readability
- **Use linting tools** like ESLint to catch these issues automatically

## Extra Analysis

### Technical Debt (0 items)

✅ **No technical debt markers found!**

### Bundle Size Impact (Top 15 largest files)

| File | Size (KB) | Lines | Complexity | Imports | Impact Score |
|------|-----------|-------|------------|---------|-------------|
| `scripts/report_code_health.ts` | 29.7 | 783 | 116 | 2 | 265 |
| `app/privacy/page.tsx` | 18.9 | 329 | 52 | 5 | 130 |
| `components/clients/client-context-sidebar.tsx` | 18.2 | 401 | 51 | 11 | 137 |
| `components/global/landing-page.tsx` | 16.1 | 287 | 37 | 5 | 98 |
| `components/ai-services/base-ai-service-dialog.tsx` | 15.7 | 485 | 61 | 16 | 162 |
| `app/terms/page.tsx` | 15.6 | 291 | 52 | 5 | 127 |
| `app/privacy/settings/page.tsx` | 15.2 | 383 | 53 | 9 | 135 |
| `components/ui/consent-manager.tsx` | 14.7 | 343 | 42 | 9 | 112 |
| `app/api/chat/route.ts` | 13.3 | 377 | 18 | 13 | 69 |
| `components/ai-services/ai-services-client.tsx` | 12.2 | 277 | 38 | 10 | 103 |
| `components/assistant/chat-input.tsx` | 11.7 | 362 | 35 | 13 | 101 |
| `lib/subscription-utils.ts` | 11.0 | 360 | 16 | 4 | 49 |
| `components/documents/document-list.tsx` | 10.9 | 265 | 35 | 9 | 94 |
| `app/admin/page.tsx` | 10.9 | 310 | 52 | 7 | 125 |
| `components/ai-services/custom-document-generator-dialog.tsx` | 10.7 | 322 | 41 | 13 | 112 |

**Bundle Analysis Summary:**
- **Total codebase size**: 0.80 MB
- **Average file complexity**: 14
- **Largest file**: scripts/report_code_health.ts (29.7 KB)
- **Most complex file**: scripts/report_code_health.ts

### Extra Recommendations

**Technical Debt:**
- **Prioritize FIXME and HACK items** as they indicate urgent issues
- **Set regular technical debt cleanup sessions** to address TODO items
- **Use issue tracking** to convert debt markers into actionable tasks

**Bundle Optimization:**
- **Code split large files** to improve loading performance
- **Review high-complexity files** for refactoring opportunities
- **Consider lazy loading** for heavy components and utilities
- **Optimize imports** to reduce bundle size and improve tree-shaking
- **Use bundle analyzers** to identify optimization opportunities

