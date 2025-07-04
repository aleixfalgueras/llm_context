# LLM Context

A production-ready AI-powered marketing assistant platform built with Next.js 14, React 18, and OpenRouter AI integration. Designed for marketing professionals and content creators to streamline client management, generate personalized marketing content, and scale their business operations efficiently with enterprise-grade privacy compliance and modular architecture.

## ✨ Key Features

### 🤖 **Dual AI Model Architecture**
- **Dual Model System**: All subscription tiers use Google Gemini 2.0 Flash and OpenAI GPT-4.1 Nano through OpenRouter
- **Latest AI Technology**: Google Gemini 2.0 Flash ($0.10/M input, $0.40/M output) with 1M context length
- **Alternative Choice**: OpenAI GPT-4.1 Nano ($0.10/M input, $0.40/M output) with 200K context length
- **Unified Integration**: Single OpenRouter interface providing access to both premium models
- **Cost-Optimized Pricing**: Models chosen for 86-91% profit margins while maintaining high quality
- **User Choice**: Select preferred model per conversation or use system default
- **Real-time Usage Tracking**: Token consumption monitoring across both models
- **Business Sustainability**: Pricing ensures long-term platform viability

### 👥 **Comprehensive Client Management**
- **Rich Client Profiles**: Store business information, contact details, general context, and up to 3 specific context fields
- **Multi-language Support**: Generate documents in 10 languages (English, Spanish, French, German, Italian, Portuguese, Dutch, Polish, Russian, Catalan)
- **Document Association**: All generated content automatically linked to specific clients
- **Privacy-First Design**: Secure data handling with complete user isolation
- **Client Context Integration**: Dynamic context selection for AI interactions

### 📝 **Advanced Prompt Management**
- **Custom Prompt Library**: Create, organize, and reuse personalized AI templates
- **Smart Variable Replacement**: Automatic substitution of client data (`{country}`, `{general_context}`, `{specific_context_1}`, `{specific_context_2}`, `{specific_context_3}`)
- **Category Organization**: Sort prompts by type (marketing, content, strategy, social-media, copywriting, analysis)
- **Usage Analytics**: Track which prompts are most effective for your workflow
- **Sample Templates**: Pre-built prompts for common marketing tasks
- **Prompt Selector Integration**: Use prompts directly in chat interface

### 🎯 **Clean Prompt Architecture**
- **Service-Owned Prompts**: Each AI service defines its own explicit prompt within its route file for maximum transparency and maintainability
- **Shared Client Context**: Centralized `buildClientContextSection()` function ensures consistent privacy respect across all services
- **Privacy-First Design**: User context selections strictly respected - only selected client fields are shared with AI
- **Clear Separation**: Service-specific prompt logic separated from client context handling
- **Explicit Control**: Prompts are visible and easily customizable in their respective service files

### ⚡ **Professional AI Services**
- **Meeting Report Generator**: Transform meeting transcriptions into professional, actionable reports
- **Custom Document Generator**: Create marketing content using your own prompt templates
- **Tiered Model Selection**: Choose appropriate AI model based on your subscription tier
- **Performance-Optimized Routing**: Automatic selection of best model based on task requirements and plan access
- **Token Usage Tracking**: Real-time monitoring of token consumption across all services
- **Automatic Document Storage**: All content saved to Supabase with organized file structure
- **Document Export**: Download documents in Markdown format
- **Document Management**: Update, rename, and organize generated content

### 🛡️ **Enterprise-Grade Privacy & Compliance**
- **GDPR Compliant**: Complete consent management system with audit trails
- **Data Export**: Full user data export in JSON format
- **Account Deletion**: Automated data purging with configurable grace periods
- **Cookie Management**: Granular cookie preferences and compliance
- **Privacy Dashboard**: User-controlled privacy settings and data rights
- **Policy Version Management**: Automatic consent renewal when policies update

### 💳 **Sustainable Subscription & Usage Management**
- **Profitable Business Model**: Subscription pricing covers all AI costs with healthy margins
- **Token-Based Limits**: Fair usage limits calculated based on most expensive models in each tier
- **Real-Time Tracking**: Monitor token consumption and document generation
- **Tier-Based Access**: Different model access levels based on subscription plan
- **Upgrade Incentives**: Clear benefits for moving to higher tiers
- **Business Sustainability**: Pricing ensures long-term platform viability

### 📊 **Analytics & Insights**
- **Token Usage Tracking**: Monitor consumption patterns across different models
- **Model Performance Analysis**: Track which models work best for different tasks
- **Subscription Analytics**: Understand usage patterns and upgrade triggers
- **Client Activity Monitoring**: Track content generation patterns per client
- **User Feedback System**: Built-in feedback collection for continuous improvement
- **Performance Monitoring**: Logging and timing analysis across all models

## 🏗️ Modular Architecture

### **Recently Refactored Modular Structure**
The codebase has been completely refactored to follow the Single Responsibility Principle with clean modular architecture:

#### **Database Operations Module** (`/lib/database/`)
- **base-operations.ts**: Generic CRUD operations with ownership verification
- **client-operations.ts**: Client-specific database logic and search
- **document-operations.ts**: Document lifecycle management
- **prompt-operations.ts**: Prompt library operations with analytics
- **Purpose**: Centralized, type-safe database operations with consistent error handling

#### **OpenRouter Integration Module** (`/lib/openrouter/`)
- **client.ts**: Low-level OpenRouter API client with streaming support
- **service.ts**: High-level AI service with usage tracking and orchestration
- **error-handler.ts**: Comprehensive AI-specific error handling and recovery
- **stream-handler.ts**: Real-time streaming response processing
- **Purpose**: Complete abstraction of OpenRouter API with usage tracking and error resilience

#### **Document Management Module** (`/lib/documents/`)
- **repository.ts**: Database document operations and querying
- **storage-service.ts**: Supabase file storage operations and validation
- **service.ts**: Server-side document orchestration with authentication
- **client-service.ts**: Client-side document operations via API calls
- **server.ts**: Server-only exports for API routes
- **Purpose**: Complete document lifecycle management from creation to storage and retrieval

### **Architectural Benefits**
- **Single Responsibility**: Each module handles one specific concern
- **Type Safety**: Comprehensive TypeScript implementation throughout
- **Better Testability**: Smaller, focused units that are easier to test
- **Enhanced Maintainability**: Changes to one responsibility don't affect others
- **Improved Reusability**: Individual services can be reused across features
- **Clean Separation**: Clear boundaries between UI, business logic, and data access

## 🏗️ Tech Stack

### **Frontend**
- **Next.js 14**: App Router with optimized server/client components
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first CSS framework with responsive design
- **shadcn/ui**: High-quality, accessible UI component library
- **Lucide React**: Beautiful, customizable icon system
- **next-themes**: Dark/light mode support

### **Backend & Database**
- **Supabase**: PostgreSQL database with real-time capabilities and file storage
- **Prisma ORM**: Type-safe database operations with automatic migrations
- **Server Actions**: Next.js server-side data mutations
- **API Routes**: RESTful endpoints for AI services and data management
- **Middleware**: Authentication and usage protection

### **OpenRouter AI Platform**
- **OpenRouter Integration**: Unified API access to Google Gemini 2.0 Flash and OpenAI GPT-4.1 Nano
- **Dual Model Access**: Both premium models available across all subscription tiers
- **Business-Sustainable Pricing**: Token limits calculated to cover AI costs with 86-91% profit margins
- **Modular AI Architecture**: Clean separation between AI client, service, error handling, and streaming
- **Token Tracking**: Accurate usage monitoring across both models without confusing cost estimates
- **Streaming Support**: Real-time response streaming for both Google and OpenAI models

### **Authentication & Security**
- **Clerk**: Complete authentication solution with user management
- **Route Protection**: Middleware-based authentication for all protected routes
- **Data Validation**: Comprehensive input validation and sanitization
- **Usage Limits**: Subscription-based feature access control
- **Model Access Control**: Server-side validation of model tier access

## 💰 Pricing Strategy

### **Basic Plan - $10/month**
- **5M tokens per month** (91.25% profit margin)
- **3 client profiles**
- **50 MB storage**
- **Both AI Models**: Google Gemini 2.0 Flash and OpenAI GPT-4.1 Nano

### **Pro Plan - $25/month**  
- **15M tokens per month** (89.5% profit margin)
- **Unlimited client profiles**
- **200 MB storage**
- **Both AI Models**: Google Gemini 2.0 Flash and OpenAI GPT-4.1 Nano

### **Business Plan - $50/month**
- **40M tokens per month** (86% profit margin)
- **Unlimited client profiles**
- **2 GB storage**
- **Both AI Models**: Google Gemini 2.0 Flash and OpenAI GPT-4.1 Nano


## 📂 Project Structure

```
├── app/                     # Next.js App Router
│   ├── api/                 # API Routes
│   │   ├── ai-services/     # AI content generation endpoints
│   │   ├── chat/           # Chat API endpoint
│   │   ├── prompts/        # Prompt management CRUD
│   │   ├── consent/        # GDPR compliance endpoints
│   │   ├── data-export/    # User data export functionality
│   │   ├── feedback/       # User feedback collection
│   │   ├── subscription/   # Usage tracking and billing
│   │   └── account/        # Account management & deletion
│   ├── assistant/          # AI chat interface
│   │   └── chat/[id]/      # Individual chat sessions
│   ├── ai-services/        # AI services dashboard
│   ├── clients/           # Client management interface
│   ├── prompts/           # Prompt library management
│   ├── pricing/           # Subscription plans page
│   ├── privacy/           # Privacy policy & settings
│   ├── terms/             # Terms of service
│   └── feedback/          # User feedback page
├── components/             # React components
│   ├── ui/                # shadcn/ui base components
│   ├── assistant/         # Chat interface components
│   ├── clients/           # Client management components
│   ├── prompts/           # Prompt management components
│   ├── ai-services/       # AI services components
│   ├── documents/         # Document management components
│   └── global/            # Shared components
├── lib/                   # Utility libraries (modular architecture)
│   ├── database/          # Database operations module
│   │   ├── base-operations.ts    # Generic CRUD operations
│   │   ├── client-operations.ts  # Client-specific database logic
│   │   ├── document-operations.ts # Document management operations
│   │   ├── prompt-operations.ts  # Prompt library operations
│   │   └── index.ts             # Unified exports
│   ├── openrouter/        # OpenRouter AI integration module
│   │   ├── client.ts            # Low-level OpenRouter API client
│   │   ├── service.ts           # High-level AI service with usage tracking
│   │   ├── error-handler.ts     # AI-specific error handling
│   │   ├── stream-handler.ts    # Streaming response processing
│   │   └── index.ts             # Unified exports
│   ├── documents/         # Document management module
│   │   ├── repository.ts        # Database document operations
│   │   ├── storage-service.ts   # Supabase file storage operations
│   │   ├── service.ts           # Server-side document service
│   │   ├── client-service.ts    # Client-side document operations
│   │   ├── server.ts            # Server-only exports
│   │   └── index.ts             # Client-safe exports
│   ├── actions.ts         # Server actions for chat
│   ├── client-actions.ts  # Client CRUD operations
│   ├── client-context-utils.ts # Centralized client context handling
│   ├── consent-utils.ts   # GDPR utilities
│   ├── subscription-utils.ts # Usage tracking & limits
│   ├── data-export-utils.ts # Data export functionality
│   ├── language-utils.ts  # Multi-language support
│   ├── models-config.ts   # Dual-model configuration (Gemini 2.0 Flash + GPT-4.1 Nano)
│   ├── logger.ts          # Comprehensive logging system
│   ├── ai-wrapper.ts      # Unified AI integration abstraction
│   └── variable-replacement.ts # Variable substitution
├── prisma/               # Database
│   ├── schema.prisma     # Complete database schema
│   └── migrations/       # Database migrations
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
└── scripts/              # Database seeding & utilities
```

## 🗄️ Database Schema

### **Core Models**
- **Chat**: AI conversations with client associations and context tracking
- **Message**: Individual chat messages with model tracking and cost data
- **Client**: Business profiles with contact info and language preferences
- **Document**: Generated content with metadata, storage paths, and client linking
- **Prompt**: Custom templates with usage analytics and category organization

### **Subscription & Usage Models**
- **UserSubscription**: Subscription plans and billing information
- **UserUsage**: Monthly usage tracking (conversations, documents, tokens, costs)
- **UserUsage**: Monthly usage aggregation for billing and analytics

### **Privacy & Compliance Models**
- **UserConsent**: GDPR consent preferences with version tracking
- **ConsentAuditLog**: Complete consent change history for compliance
- **DataExportRequest**: User data export and deletion request tracking
- **Feedback**: User feedback and feature requests with categorization

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Supabase recommended)
- OpenRouter API key with credits (provides access to 400+ AI models)
- Clerk account for authentication


### Environment Setup
Create `.env.local` with these variables:

```env
# Database
DATABASE_URL="your_supabase_database_url"
DIRECT_URL="your_supabase_direct_url"

# OpenRouter API (unified AI provider)
OPENROUTER_API_KEY="your_openrouter_api_key"

# Supabase Storage
SUPABASE_URL="your_supabase_project_url"
SUPABASE_KEY="your_supabase_service_role_key"
NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url"
NEXT_PUBLIC_SUPABASE_KEY="your_supabase_anon_key"

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
CLERK_SECRET_KEY="your_clerk_secret_key"

# OpenRouter Configuration
OPENROUTER_API_KEY="your_openrouter_api_key"
# Optional: Override the default model (defaults to openai/gpt-4o-mini if not set)
OPENROUTER_DEFAULT_MODEL="openai/gpt-4o-mini"
# Optional: Override generation parameters (defaults are defined in lib/models-config.ts)
# OPENROUTER_TEMPERATURE="0.7"
# OPENROUTER_PRESENCE_PENALTY="0.1"
# OPENROUTER_FREQUENCY_PENALTY="0.1"

# Optional: Site information for OpenRouter rankings
SITE_URL="https://yourdomain.com"
SITE_NAME="Your App Name"

# Email Services

```

### Installation

1. **Install dependencies:**
```bash
npm install --legacy-peer-deps
```

2. **Set up database:**
```bash
npx prisma generate
npx prisma db push
```

3. **Seed sample data (optional):**
```bash
npx tsx scripts/seed-prompts.ts
```

4. **Start development server:**
```bash
npm run dev
```

5. **Open [http://localhost:3000](http://localhost:3000)**

## 📋 Usage Workflow

### **1. Account Setup**
- Sign up using Clerk authentication
- Complete GDPR consent process
- Choose your subscription plan

### **2. Client Management**
- Navigate to `/clients` to create client profiles
- Add business information and location
- Set preferred document generation language

### **3. Prompt Library Setup**
- Go to `/prompts` to create custom templates
- Use variables: `{client_name}`, `{country}`
- Organize by category and track usage analytics

### **4. AI Assistant**
- Visit `/assistant` for AI conversations
- Select client and choose context fields
- Use prompt selector for quick template access
- Export conversations when needed

### **5. AI Services**
- Access `/ai-services` for document generation
- Generate meeting reports from transcriptions
- Create custom documents using prompt templates
- Automatically save and organize all content

### **6. Document Management**
- View all generated documents in client profiles
- Export to Markdown for professional delivery

- Update and maintain document versions

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npx prisma generate     # Generate Prisma client
npx prisma db push      # Push schema changes
npx prisma studio       # Open database GUI

# Testing & Scripts
npx tsx scripts/test-logging.ts    # Test logging system
npx tsx scripts/seed-prompts.ts    # Seed sample prompts
```

## 📊 Monitoring & Analytics

### **Built-in Analytics**
- Real-time usage tracking per user
- Cost monitoring for OpenAI API calls
- Prompt effectiveness analytics
- Client engagement metrics

### **Logging System**
- Comprehensive request/response logging
- Performance timing for all operations
- Error tracking with full context
- Client-side interaction logging

### **Usage Limits**
- Conversation count tracking
- Token usage monitoring
- Cost-based limits per subscription tier
- Automatic limit enforcement

## 🛡️ Security & Privacy

### **GDPR Compliance**
- Complete consent management system
- Audit trails for all consent changes
- User data export capabilities
- Right to deletion implementation

### **Security Features**
- User data isolation
- Input validation and sanitization
- Secure file storage via Supabase
- Protected API routes with authentication

## 🚀 Deployment

### **Vercel Deployment**
```bash
# Build command (configured in package.json)
npm run vercel-build

# Environment variables required:
# - All .env.local variables
# - DATABASE_URL (production)
# - OPENROUTER_API_KEY
# - CLERK keys
# - SUPABASE credentials

```

### **Database Setup**
```bash
# After Vercel deployment
npx prisma migrate deploy
```

## 📈 Scaling Considerations

### **Performance Optimization**
- Database indexes for common queries
- Efficient OpenAI token usage
- Optimized file storage patterns
- Caching strategies for static content

### **Cost Management**
- Usage tracking and limits
- Model selection optimization
- Token efficiency monitoring
- Automated cost alerts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:
- Check the documentation files in the project root
- Review the comprehensive logging output
- Submit feedback through the in-app feedback system

---

**Built with ❤️**

## Setting up Prisma Migrations for Deployment

If you want to use proper Prisma migrations instead of `prisma db push` for deployments:

1. **Create a baseline migration** (run this locally):
   ```bash
   # Create the migrations directory and baseline migration
   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql
   
   # Mark the migration as applied in your database
   npx prisma migrate resolve --applied 0_init
   ```

2. **Update your vercel-build script** in package.json:
   ```json
   "vercel-build": "npx prisma migrate deploy && npx prisma generate && next build"
   ```

3. **For future schema changes**, use:
   ```bash
   npx prisma migrate dev --name describe_your_change
   ```

This ensures your database changes are tracked properly and can be reliably deployed.
