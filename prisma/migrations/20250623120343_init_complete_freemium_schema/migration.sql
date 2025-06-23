-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "chats" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "contextFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "model" TEXT,
    "chatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "country" TEXT,
    "goals" TEXT,
    "notes" TEXT,
    "documentsLanguage" TEXT NOT NULL DEFAULT 'english',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "documentPath" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT,
    "userName" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "useCase" TEXT,
    "stepsToReproduce" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "maxConversationsPerMonth" INTEGER NOT NULL DEFAULT 50,
    "maxClients" INTEGER NOT NULL DEFAULT 3,
    "maxPromptsPerUser" INTEGER NOT NULL DEFAULT 10,
    "maxDocumentsPerMonth" INTEGER NOT NULL DEFAULT 20,
    "maxTokensPerMonth" INTEGER NOT NULL DEFAULT 100000,
    "maxCostPerMonth" DOUBLE PRECISION NOT NULL DEFAULT 2.00,
    "canAccessPremiumPrompts" BOOLEAN NOT NULL DEFAULT false,
    "canAccessTeamFeatures" BOOLEAN NOT NULL DEFAULT false,
    "canAccessPrioritySupport" BOOLEAN NOT NULL DEFAULT false,
    "canAccessCustomBranding" BOOLEAN NOT NULL DEFAULT false,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "canceledAt" TIMESTAMP(3),

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "conversationsUsed" INTEGER NOT NULL DEFAULT 0,
    "documentsGenerated" INTEGER NOT NULL DEFAULT 0,
    "promptsUsed" INTEGER NOT NULL DEFAULT 0,
    "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "resourceId" TEXT,
    "tokensUsed" INTEGER,
    "estimatedCost" DOUBLE PRECISION,
    "model" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dataProcessing" BOOLEAN NOT NULL DEFAULT false,
    "analytics" BOOLEAN NOT NULL DEFAULT false,
    "marketing" BOOLEAN NOT NULL DEFAULT false,
    "agreedToTerms" BOOLEAN NOT NULL DEFAULT false,
    "agreedToPrivacy" BOOLEAN NOT NULL DEFAULT false,
    "termsVersion" TEXT,
    "privacyVersion" TEXT,
    "cookiesNecessary" BOOLEAN NOT NULL DEFAULT true,
    "cookiesAnalytics" BOOLEAN NOT NULL DEFAULT false,
    "cookiesMarketing" BOOLEAN NOT NULL DEFAULT false,
    "cookiesFunctional" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "consentMethod" TEXT,
    "consentGivenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "withdrawnAt" TIMESTAMP(3),

    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "previousValue" BOOLEAN,
    "newValue" BOOLEAN NOT NULL,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_export_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requestData" JSONB,
    "filePath" TEXT,
    "expiresAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_export_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_userId_key" ON "user_subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_usage_userId_year_month_key" ON "user_usage"("userId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "user_consents_userId_key" ON "user_consents"("userId");

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
