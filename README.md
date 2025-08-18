# LLM Context

A Next.js application for managing client contexts and AI-powered chat interactions with comprehensive document generation capabilities.

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first CSS framework
- **Radix UI** - Headless UI components
- **shadcn/ui** - Pre-styled component library

### Backend
- **Next.js API Routes** - HTTP endpoints
- **Server Actions** - Form handling and data mutations
- **PostgreSQL** - Primary database
- **Prisma ORM** - Type-safe database client

### Infrastructure & Services
- **Supabase** - File storage and real-time features
- **Clerk** - Authentication and user management
- **Stripe** - Payment processing and subscriptions
- **OpenRouter API** - AI model integration
- **Upstash Redis** - Caching layer
- **Vercel** - Deployment platform

## 3-Layer Architecture Pattern

This application follows a strict 3-layer architecture pattern ensuring clear separation of concerns and maintainable code structure.

### Layer 1: Presentation Layer
Handles all user interface and HTTP communication concerns.

**Responsibilities:**
- Rendering UI components
- Handling user interactions
- Managing HTTP requests/responses
- Form submissions and validation

**Components:**
- **Pages** (`app/[route]/`) - Next.js pages and layouts
- **Components** (`components/`) - Reusable React components
- **UI Library** (`components/ui/`) - shadcn/ui components
- **Server Actions** (`app/actions/`) - Handle form submissions
- **API Routes** (`app/api/`) - RESTful endpoints

### Layer 2: Business Logic Layer
Contains all business rules and orchestration logic.

**Responsibilities:**
- Business rule implementation
- Data transformation and validation
- Orchestrating multiple operations
- Complex calculations and algorithms

**Components:**
- **Services** (`services/`) - All business logic lives here
- No knowledge of HTTP or UI concerns
- Returns domain objects and DTOs
- Orchestrates calls to data layer

### Layer 3: Data Access Layer
Manages all database operations and external data sources.

**Responsibilities:**
- Database queries and mutations
- Data persistence
- External API integrations
- Cache management

**Components:**
- **Database Operations** (`database/`) - Prisma queries
- **Storage Service** (`services/storage-service.ts`) - File storage
- **External APIs** (`services/openrouter/`) - AI model integration

### Architectural Rules

1. **Dependency Flow**: Always downward (Presentation ’ Business ’ Data)
2. **No Layer Jumping**: UI/API must go through services
3. **Single Responsibility**: Each layer handles only its designated concerns
4. **Type Safety**: Use Prisma-generated types throughout
5. **No Reverse Dependencies**: Lower layers never reference upper layers

## Project Structure

The codebase is organized to reflect the 3-layer architecture:

### Presentation Layer Structure
- `app/` - Next.js App Router pages and routes
  - `actions/` - Server actions for forms
  - `api/` - RESTful API endpoints
  - `[routes]/` - Page components
- `components/` - React components
  - `ui/` - Base UI components (shadcn/ui)
  - `[feature]/` - Feature-specific components
- `hooks/` - Custom React hooks

### Business Logic Layer Structure
- `services/` - All business logic
  - `ai-services/` - AI document generation
  - `client/` - Client management logic
  - `subscription/` - Subscription handling
  - `openrouter/` - AI model orchestration
  - Individual service files for each domain

### Data Access Layer Structure
- `database/` - All database operations
  - `base-operations.ts` - Common patterns
  - `[entity]-operations.ts` - Entity-specific queries
- `prisma/` - Database schema and migrations
  - `schema.prisma` - Database models
  - `migrations/` - Schema evolution

### Supporting Structure
- `lib/` - Shared utilities and configurations
  - `types/` - TypeScript type definitions
  - `utils/` - Helper functions
  - `stripe/` - Payment integration
  - Configuration files
- `resources/` - Documentation and scripts
  - `readme/` - Technical documentation
  - `scripts/` - Utility scripts