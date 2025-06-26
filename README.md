# AI Marketing Assistant

A modern AI-powered marketing assistant built with Next.js 14, React 18, and multi-AI integration. Designed for marketing professionals and content creators to streamline client management, generate personalized marketing content, and scale their business operations with the best AI models from multiple providers.

## 🆕 Recent Updates & Improvements

### **Multi-AI Integration (Latest)**
- **Multiple AI Providers**: Seamless integration of OpenAI and Anthropic Claude models
- **Unified Model Selection**: Choose from GPT-4o, GPT-4o-mini, Claude 4 Opus, Claude 4 Sonnet, and Claude 3.5 Haiku
- **Cost-Aware Recommendations**: Each model shows provider, cost implications, and optimal use cases
- **Provider Transparency**: Clear indication of which AI provider powers each model
- **Intelligent Fallbacks**: Robust error handling across multiple AI providers
- **Per-Service Selection**: Different model choice for AI services and chat assistant
- **Persistent Preferences**: Your model choice is remembered across sessions

### **Simplified Usage System**
- **Streamlined Limits**: Focus on essential metrics (documents, tokens, cost)
- **Removed Restrictions**: Unlimited custom prompts and conversations for better UX
- **Improved Analytics**: Better tracking of actual value-generating activities
- **Clearer Pricing**: More transparent usage limits aligned with real costs

### **Enhanced Document Management**
- **In-Place Editing**: Edit document content and names after creation
- **Better Organization**: Improved search, filtering, and document management
- **Streamlined Interface**: Removed unnecessary features, focused on core functionality
- **Performance Improvements**: Faster document operations and better error handling

## ✨ Key Features

### 🤖 **Multi-AI-Powered Content Creation**
- **Multi-Provider Support**: Access OpenAI and Anthropic models through unified interface
- **Comprehensive Model Library**: GPT-4o, GPT-4o-mini, Claude 4 Opus, Claude 4 Sonnet, Claude 3.5 Haiku
- **Intelligent Model Selection**: Choose optimal AI provider and model for each task
- **Cost-Optimized Usage**: Transparent pricing across providers with automated cost tracking
- **Provider Redundancy**: Robust failover capabilities across multiple AI providers
- **Comprehensive Business Assistant**: Full-spectrum support for marketing business operations (strategy, client management, content creation, campaigns, analysis, operations, industry insights, problem-solving)
- **Client-Aware AI**: Contextual responses using selected client information when relevant
- **Smart Context Control**: Select specific client fields (country, notes) for each conversation with strict privacy respect
- **Flexible Assistance**: Provides general business advice when no client context is selected, personalized guidance when context is provided
- **Token Optimization**: Efficient context injection to minimize API costs across all providers
- **Real-time Chat**: Advanced chat interface with persistent conversation history
- **Chat Export**: Export conversations to markdown format
- **Model Persistence**: Remembers your provider and model choice per chat session

### 👥 **Comprehensive Client Management**
- **Rich Client Profiles**: Store business information, contact details, and project notes
- **Multi-language Support**: Generate documents in 10 languages (English, Spanish, French, German, Italian, Portuguese, Dutch, Polish, Russian, Catalan)
- **Document Association**: All generated content automatically linked to specific clients
- **Privacy-First Design**: Secure data handling with complete user isolation
- **Client Context Integration**: Dynamic context selection for AI interactions

### 📝 **Advanced Prompt Management**
- **Custom Prompt Library**: Create, organize, and reuse personalized AI templates
- **Smart Variable Replacement**: Automatic substitution of client data (`{client_name}`, `{country}`)
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

### ⚡ **Professional Multi-AI Services**
- **Meeting Report Generator**: Transform meeting transcriptions into professional, actionable reports
- **Custom Document Generator**: Create marketing content using your own prompt templates
- **Multi-Provider Model Selection**: Choose optimal AI provider and model for each service
- **Performance-Optimized Routing**: Automatic selection of best provider based on task requirements
- **Cross-Provider Cost Tracking**: Unified usage monitoring across OpenAI and Anthropic
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

### 💳 **Multi-AI Subscription & Usage Management**
- **Freemium Model**: Free tier with generous limits for testing across all providers
- **Unified Usage Tracking**: Real-time monitoring of conversations, documents, and API costs across OpenAI and Anthropic
- **Cross-Provider Analytics**: Comprehensive cost tracking regardless of AI provider used
- **Flexible Plans**: Multiple subscription tiers accommodating different provider preferences
- **Multi-AI Cost Optimization**: Smart token management to minimize expenses across all AI providers
- **Provider Performance Insights**: Detailed analytics showing usage patterns by AI provider

### 📊 **Multi-AI Analytics & Insights**
- **Prompt Usage Tracking**: Monitor which templates drive best results across all providers
- **Cross-Provider Cost Analysis**: Track API usage and costs across OpenAI and Anthropic models
- **Provider Performance Comparison**: Analyze response quality and speed by AI provider
- **Client Activity Monitoring**: Track content generation patterns per client across all models
- **Multi-AI Usage Patterns**: Insights into which providers are preferred for different tasks
- **User Feedback System**: Built-in feedback collection for continuous improvement
- **Comprehensive Performance Monitoring**: Logging and timing analysis across all AI providers

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

### **Multi-AI & External Services**
- **OpenAI API**: GPT-4o and GPT-4o-mini integration with cost tracking
- **Anthropic API**: Claude 4 Opus, Claude 4 Sonnet, and Claude 3.5 Haiku integration
- **Unified AI Wrapper**: Single interface handling multiple AI providers seamlessly
- **Cross-Provider Cost Tracking**: Unified billing and usage monitoring across all AI services
- **Provider Failover**: Automatic fallback capabilities for enhanced reliability
- **AI SDK**: Streamlined multi-provider AI integration with streaming support

### **Authentication & Security**
- **Clerk**: Complete authentication solution with user management
- **Route Protection**: Middleware-based authentication for all protected routes
- **Data Validation**: Comprehensive input validation and sanitization
- **Usage Limits**: Subscription-based feature access control

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
├── lib/                   # Utility libraries
│   ├── actions.ts         # Server actions for chat
│   ├── client-actions.ts  # Client CRUD operations
│   ├── document-actions.ts # Document management
│   ├── client-context-utils.ts # Centralized client context handling
│   ├── consent-utils.ts   # GDPR utilities
│   ├── subscription-utils.ts # Usage tracking & limits
│   ├── data-export-utils.ts # Data export functionality
│   ├── language-utils.ts  # Multi-language support
│   ├── models-config.ts   # Multi-AI model configuration
│   ├── logger.ts          # Comprehensive logging system
│   ├── ai-wrapper.ts      # Unified multi-AI integration
│   ├── openai-wrapper.ts  # Legacy OpenAI API integration
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
- OpenAI API key with credits
- Anthropic API key for Claude models
- Clerk account for authentication


### Environment Setup
Create `.env.local` with these variables:

```env
# Database
DATABASE_URL="your_supabase_database_url"
DIRECT_URL="your_supabase_direct_url"

# AI Providers
OPENAI_API_KEY="your_openai_api_key"
ANTHROPIC_API_KEY="your_anthropic_api_key"

# Supabase Storage
SUPABASE_URL="your_supabase_project_url"
SUPABASE_KEY="your_supabase_service_role_key"
NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url"
NEXT_PUBLIC_SUPABASE_KEY="your_supabase_anon_key"

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
CLERK_SECRET_KEY="your_clerk_secret_key"

# OpenAI Configuration
OPENAI_API_KEY="your_openai_api_key"
# Optional: Override the default model (defaults to gpt-4o-mini if not set)
OPENAI_API_DEFAULT_MODEL="gpt-4o-mini"
# Optional: Override OpenAI generation parameters (defaults are defined in lib/models-config.ts)
# OPENAI_TEMPERATURE="0.7"
# OPENAI_MAX_TOKENS="1000"
# OPENAI_PRESENCE_PENALTY="0.1"
# OPENAI_FREQUENCY_PENALTY="0.1"

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
# - OPENAI_API_KEY
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

**Built with ❤️ for marketing professionals who want to scale their content creation with AI while maintaining the highest standards of privacy and security.**
