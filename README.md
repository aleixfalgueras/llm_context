# AI Marketing Assistant

A modern AI-powered marketing assistant built with Next.js 14, React 18, and OpenAI integration. Designed for marketing professionals and content creators to streamline client management, generate personalized marketing content, and scale their business operations.

## ✨ Key Features

### 🤖 **AI-Powered Content Creation**
- **Multi-Model Support**: Choose between GPT-4o and GPT-4o-mini based on your needs and budget
- **Client-Aware AI**: Contextual responses using selected client information
- **Smart Context Control**: Select specific client fields (country, goals, notes) for each conversation
- **Token Optimization**: Efficient context injection to minimize API costs
- **Real-time Chat**: ChatGPT-like interface with persistent conversation history

### 👥 **Comprehensive Client Management**
- **Rich Client Profiles**: Store business information, contact details, marketing goals, and project notes
- **Multi-language Support**: Generate documents in 10 languages (English, Spanish, French, German, Italian, Portuguese, Dutch, Polish, Russian, Catalan)
- **Document Association**: All generated content automatically linked to specific clients
- **Privacy-First Design**: Secure data handling with complete user isolation

### 📝 **Advanced Prompt Management**
- **Custom Prompt Library**: Create, organize, and reuse personalized AI templates
- **Smart Variable Replacement**: Automatic substitution of client data (`{client_name}`, `{country}`, `{goals}`)
- **Category Organization**: Sort prompts by type (marketing, content, strategy, social-media, copywriting, analysis)
- **Usage Analytics**: Track which prompts are most effective for your workflow
- **Sample Templates**: Pre-built prompts for common marketing tasks

### ⚡ **Professional AI Services**
- **Meeting Report Generator**: Transform meeting transcriptions into professional, actionable reports
- **Custom Document Generator**: Create marketing content using your own prompt templates
- **Automatic Document Storage**: All content saved to Supabase with organized file structure
- **PDF Export**: Professional PDF generation for client delivery
- **Email Integration**: Send documents directly to clients via Resend API

### 🛡️ **Enterprise-Grade Privacy & Compliance**
- **GDPR Compliant**: Complete consent management system with audit trails
- **Data Export**: Full user data export in JSON and PDF formats
- **Account Deletion**: Automated data purging with configurable grace periods
- **Cookie Management**: Granular cookie preferences and compliance
- **Privacy Dashboard**: User-controlled privacy settings and data rights

### 📊 **Analytics & Insights**
- **Prompt Usage Tracking**: Monitor which templates drive best results
- **Model Cost Tracking**: Track OpenAI API usage across different models
- **Client Activity**: Monitor content generation patterns per client
- **User Feedback System**: Built-in feedback collection for continuous improvement

## 🏗️ Tech Stack

### **Frontend**
- **Next.js 14.2.29**: App Router with optimized server/client components
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality, accessible UI component library
- **Lucide React**: Beautiful, customizable icon system

### **Backend & Database**
- **Supabase**: PostgreSQL database with real-time capabilities and file storage
- **Prisma ORM**: Type-safe database operations with automatic migrations
- **Server Actions**: Next.js server-side data mutations
- **API Routes**: RESTful endpoints for AI services and data management

### **AI & External Services**
- **OpenAI API**: GPT-4o and GPT-4o-mini integration
- **Resend**: Professional email delivery service
- **Puppeteer + Chromium**: Server-side PDF generation from markdown

### **Authentication & Security**
- **Clerk**: Complete authentication solution with user management
- **Route Protection**: Middleware-based authentication for all protected routes
- **Data Validation**: Comprehensive input validation and sanitization

## 📂 Project Structure

```
├── app/                     # Next.js App Router
│   ├── api/                 # API Routes
│   │   ├── ai-services/     # AI content generation
│   │   ├── chat/           # Chat API endpoint
│   │   ├── prompts/        # Prompt management
│   │   ├── consent/        # GDPR compliance
│   │   ├── data-export/    # User data export
│   │   ├── feedback/       # User feedback
│   │   └── account/        # Account management
│   ├── assistant/          # AI chat interface
│   ├── ai-services/        # AI services dashboard
│   ├── clients/           # Client management
│   ├── prompts/           # Prompt library
│   ├── privacy/           # Privacy policy & settings
│   ├── terms/             # Terms of service
│   └── feedback/          # User feedback page
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   ├── chat-*.tsx         # Chat interface
│   ├── client-*.tsx       # Client management
│   ├── prompt-*.tsx       # Prompt management
│   └── ai-services-*.tsx  # AI services
├── lib/                   # Utility libraries
│   ├── actions.ts         # Server actions
│   ├── client-actions.ts  # Client operations
│   ├── document-actions.ts # Document management
│   ├── consent-utils.ts   # GDPR utilities
│   ├── data-export-utils.ts # Data export
│   ├── language-utils.ts  # Multi-language support
│   ├── pdf-generator.ts   # PDF creation
│   └── variable-replacement.ts # Variable substitution
├── prisma/               # Database
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
└── types/                # TypeScript definitions
```

## 🗄️ Database Schema

### **Core Models**
- **Chat**: AI conversations with client associations and context tracking
- **Message**: Individual chat messages with model tracking and timestamps
- **Client**: Business profiles with contact info, goals, and language preferences
- **Document**: Generated content with metadata, storage paths, and client linking
- **Prompt**: Custom templates with usage analytics and category organization

### **Privacy & Compliance Models**
- **UserConsent**: GDPR consent preferences with audit trails
- **ConsentAuditLog**: Complete consent change history for compliance
- **DataExportRequest**: User data export and deletion request tracking
- **Feedback**: User feedback and feature requests with categorization

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Supabase recommended)
- OpenAI API key
- Clerk account for authentication
- Resend account for email services

### Environment Setup
Create `.env.local` with these variables:

```env
# Database
DATABASE_URL="your_supabase_database_url"
DIRECT_URL="your_supabase_direct_url"

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
OPENAI_API_MODEL="gpt-4o-mini"
OPENAI_TEMPERATURE="0.7"
OPENAI_MAX_TOKENS="1000"

# Email Services
RESEND_API_KEY="your_resend_api_key"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
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

3. **Start development server:**
```bash
npm run dev
```

4. **Open [http://localhost:3000](http://localhost:3000)**

## 📋 Usage Workflow

### **1. Client Management**
- Navigate to `/clients` to create client profiles
- Add business information, location, and marketing goals
- Set preferred document generation language

### **2. Prompt Library Setup**
- Go to `/prompts` to create custom templates
- Use variables: `{client_name}`, `{country}`, `{goals}`
- Organize by category and track usage analytics

### **3. AI Assistant**
- Visit `/assistant` for AI conversations
- Select client and choose context fields
- Switch between GPT-4o and GPT-4o-mini models
- Export conversations as documents

### **4. AI Services**
- Use `/ai-services` for structured content generation
- Generate meeting reports from transcriptions
- Create custom documents with prompt templates
- Automatically save and organize all content

### **5. Document Management**
- All content automatically saved to Supabase
- Generate PDFs for client delivery
- Send documents via email integration
- Organize by client and document type

## 🔒 Privacy & Compliance Features

### **GDPR Compliance**
- Comprehensive consent management system
- Complete audit trail for all data processing
- User data export in multiple formats
- Account deletion with configurable grace periods

### **Data Rights Management**
- Access: View all stored personal data
- Rectify: Update personal information
- Erase: Request account and data deletion
- Export: Download complete data archive
- Restrict: Control data processing preferences

### **Security Features**
- User data isolation between accounts
- Encrypted data transmission
- Secure file storage via Supabase
- Input validation and sanitization

## 📊 Analytics & Monitoring

- **Prompt Performance**: Track which templates generate best results
- **Cost Management**: Monitor OpenAI API usage by model
- **Client Activity**: Analyze content generation patterns
- **User Feedback**: Built-in feedback system for continuous improvement

## 🛠️ Development Commands

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint
npx prisma studio     # Database management GUI
npx prisma generate   # Generate Prisma client
npx prisma db push    # Push schema changes
```

## 🎨 Customization

### **Branding & Theming**
- Update colors in `tailwind.config.ts`
- Modify component themes in `components/ui/`
- Customize landing page in `components/landing-page.tsx`

### **AI Configuration**
- Add new OpenAI models in `components/ui/model-selector.tsx`
- Configure prompts in `lib/sample-prompts.ts`
- Extend language support in `lib/language-utils.ts`

### **Feature Extensions**
- Add new AI services in `app/api/ai-services/`
- Create custom document types in `types/document-types.ts`
- Extend privacy features in `lib/consent-utils.ts`

## 🚀 Deployment

### **Vercel (Recommended)**
1. Connect GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### **Production Checklist**
- [ ] Set up custom domain
- [ ] Configure email forwarding for privacy contacts
- [ ] Set up database backups
- [ ] Configure monitoring and alerts
- [ ] Test all privacy compliance features

## 📈 Scaling Considerations

### **Cost Management**
- Monitor OpenAI token usage with built-in analytics
- Implement usage limits per subscription tier
- Track costs per client/conversation

### **Performance Optimization**
- Database connection pooling via Prisma
- Implement Redis caching for frequent queries
- Optimize image delivery via Supabase CDN

### **Compliance Scaling**
- Built-in GDPR compliance scales automatically
- Audit logs maintain compliance at any scale
- Data export system handles large datasets

## 🤝 Support & Feedback

- **Built-in Feedback**: Use `/feedback` page for feature requests and bug reports
- **Documentation**: This README and AI_SERVICES_README.md
- **Database Management**: Use Prisma Studio for direct database access

## 📄 Legal & Compliance

- **Privacy Policy**: Available at `/privacy`
- **Terms of Service**: Available at `/terms`
- **GDPR Rights**: Managed through `/privacy/settings`
- **Data Processing**: Full audit trail maintained

---

**Built with ❤️ for marketing professionals who want to scale their business with AI.**

*This application provides enterprise-grade AI tools with privacy-first design, helping marketing professionals create compelling content while maintaining complete data security and compliance.*
