## Standard Workflow
1. First think through the problem, read the codebase for relevant files. Don't hesitate to ask me anything that isn't clear.
2. The plan should have a list of todo items that you can check off as you complete them.
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. **Everything is about simplicity.**
7. **ALWAYS use Prisma-generated types** - Never manually create interfaces that duplicate Prisma models.

## Architecture & Project Structure

### 3-Layer Architecture Pattern
Follow strict separation of concerns with these three layers:

#### 1. Presentation Layer (UI & API Concerns)
- **Server Actions** (`app/actions/`): Handle UI form submissions and interactions
- **API Routes** (`app/api/`): Handle HTTP requests and responses
- **Pages** (`app/[route]/`): Next.js pages and layouts
- **Components** (`components/`): React UI components
- **UI Library** (`components/ui/`): shadcn-ui components

#### 2. Business Logic Layer
- **Services** (`/services/`): Contains ALL business logic
  - No knowledge of HTTP or UI concerns
  - Orchestrates repository calls
  - Handles data transformation and business rules
  - Returns domain objects/DTOs

#### 3. Data Access Layer
- **Database Operations** (`/database/`): ALL database queries live here
  - Uses Prisma client exclusively
  - No business logic, only data access
  - Returns Prisma-generated types

### Supporting Structure
- **Types** (`lib/types/`): DTOs and custom types
  - Organized by domain (e.g., `lib/types/instagram/`)
  - Service-specific DTOs
  - Shared types and interfaces
  - NO Prisma model duplicates
- **Utilities** (`lib/utils/`): Helper functions and shared logic
- **Constants** (`lib/constants/`): App-wide constants
- **Hooks** (`hooks/`): Custom React hooks
- **Database** (`prisma/`): Schema and migrations

### Architecture Rules
- **Dependency flow**: UI/API → Services → Database (never reverse)
- **No layer jumping**: Actions/APIs must go through services
- **Single responsibility**: Each layer handles only its concerns
- **Type safety**: Use Prisma types throughout, no manual duplicates

### TypeScript Best Practices

#### Type Safety Rules
- **Always add explicit return types** for:
    - Public functions (exported functions)
    - Functions that cross architectural boundaries
    - Async functions (harder to infer return types)
    - Complex return types with unions or objects
- **Prefer `unknown` over `any`** when type is truly unknown
- **Use type guards** for runtime type checking
- **Leverage discriminated unions** for state management

#### Naming Conventions
- **Types/Interfaces**: PascalCase (e.g., `UserProfile`)
- **Type parameters**: Single uppercase letter or descriptive PascalCase (e.g., `T`, `TResponse`)
- **Enums**: PascalCase with UPPER_SNAKE_CASE values

#### Import Organization
1. External dependencies
2. Internal aliases (`@/...`)
3. Relative imports (`./...`)
4. Type imports last (`import type { ... }`)

## UI Component Guidelines
- **Always prefer using `shadcn-ui` components when implementing UI.**
- Only create a custom component from scratch **if**:
  1. No equivalent exists in `shadcn-ui`, **and**
  2. A new component significantly improves UX, styling, or functionality.
- When you use a `shadcn-ui` component, **note it in your explanation** (e.g., “used `Button` from `@/components/ui/Button`”).
- If extending or customizing is needed, **wrap or compose** the shadcn component rather than fully reimplementing it.

## Subagent Usage
- **Use subagents for complex tasks** requiring specialized focus:
  - Deep code analysis of large codebases
  - Research on libraries, APIs, or architectural decisions
  - Comprehensive testing strategy development
- **Always explain** when using a subagent and why
- **Integrate results** back into the main workflow and todo items
