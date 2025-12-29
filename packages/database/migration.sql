-- Game View Platform Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE "UserRole" AS ENUM ('PLAYER', 'CREATOR', 'ADMIN');
CREATE TYPE "Category" AS ENUM ('ENTERTAINMENT', 'EDUCATION', 'EXPLORATION');
CREATE TYPE "ExperienceStatus" AS ENUM ('DRAFT', 'PROCESSING', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "AgeRating" AS ENUM ('E', 'E10', 'T', 'M');
CREATE TYPE "Platform" AS ENUM ('YOUTUBE', 'TIKTOK', 'TWITCH', 'TWITTER', 'INSTAGRAM');
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'COMPLETED', 'REFUNDED', 'FAILED');
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "JobStage" AS ENUM ('DOWNLOADING', 'COLMAP', 'SPLATTING', 'UPLOADING', 'FINALIZING');
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'TRIALING');
CREATE TYPE "CreditTransactionType" AS ENUM ('MONTHLY_GRANT', 'PURCHASE', 'PUBLISH_USED', 'PROMO_CODE', 'REFUND', 'ADMIN_ADJUSTMENT', 'ROLLOVER');
CREATE TYPE "PromoCodeType" AS ENUM ('BETA_ACCESS', 'PUBLISH_CREDITS', 'SUBSCRIPTION_TRIAL', 'DISCOUNT');
CREATE TYPE "AppType" AS ENUM ('DESKTOP', 'STUDIO', 'PLAYER');
CREATE TYPE "UpdateType" AS ENUM ('PATCH', 'MINOR', 'MAJOR', 'SECURITY');

-- ============================================
-- CORE TABLES
-- ============================================

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'PLAYER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");
CREATE INDEX "User_email_idx" ON "User"("email");

CREATE TABLE "Creator" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "tagline" TEXT,
    "avatarUrl" TEXT,
    "bannerUrl" TEXT,
    "websiteUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPro" BOOLEAN NOT NULL DEFAULT false,
    "stripeAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Creator_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Creator_userId_key" ON "Creator"("userId");
CREATE UNIQUE INDEX "Creator_username_key" ON "Creator"("username");
CREATE INDEX "Creator_username_idx" ON "Creator"("username");
CREATE INDEX "Creator_userId_idx" ON "Creator"("userId");

CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "seriesId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "previewUrl" TEXT,
    "videoUrl" TEXT,
    "plyUrl" TEXT,
    "camerasJson" TEXT,
    "category" "Category" NOT NULL,
    "subcategory" TEXT NOT NULL,
    "tags" TEXT[],
    "duration" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "ExperienceStatus" NOT NULL DEFAULT 'DRAFT',
    "ageRating" "AgeRating" NOT NULL DEFAULT 'E',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Experience_creatorId_idx" ON "Experience"("creatorId");
CREATE INDEX "Experience_category_idx" ON "Experience"("category");
CREATE INDEX "Experience_status_idx" ON "Experience"("status");
CREATE INDEX "Experience_publishedAt_idx" ON "Experience"("publishedAt");

CREATE TABLE "Series" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Series_creatorId_idx" ON "Series"("creatorId");

-- ============================================
-- USER ACTIVITY TABLES
-- ============================================

CREATE TABLE "UserInterest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interest" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserInterest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserInterest_userId_interest_key" ON "UserInterest"("userId", "interest");
CREATE INDEX "UserInterest_userId_idx" ON "UserInterest"("userId");

CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Follow_followerId_creatorId_key" ON "Follow"("followerId", "creatorId");
CREATE INDEX "Follow_followerId_idx" ON "Follow"("followerId");
CREATE INDEX "Follow_creatorId_idx" ON "Follow"("creatorId");

CREATE TABLE "PlayHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "playTimeSeconds" INTEGER NOT NULL DEFAULT 0,
    "lastPosition" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlayHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlayHistory_userId_idx" ON "PlayHistory"("userId");
CREATE INDEX "PlayHistory_experienceId_idx" ON "PlayHistory"("experienceId");
CREATE INDEX "PlayHistory_userId_experienceId_idx" ON "PlayHistory"("userId", "experienceId");

CREATE TABLE "Wishlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Wishlist_userId_experienceId_key" ON "Wishlist"("userId", "experienceId");
CREATE INDEX "Wishlist_userId_idx" ON "Wishlist"("userId");

CREATE TABLE "ConnectedAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platformUserId" TEXT NOT NULL,
    "username" TEXT,
    "avatarUrl" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ConnectedAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ConnectedAccount_userId_platform_key" ON "ConnectedAccount"("userId", "platform");
CREATE UNIQUE INDEX "ConnectedAccount_platform_platformUserId_key" ON "ConnectedAccount"("platform", "platformUserId");
CREATE INDEX "ConnectedAccount_userId_idx" ON "ConnectedAccount"("userId");

-- ============================================
-- COMMERCE TABLES
-- ============================================

CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "stripePaymentId" TEXT,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Purchase_userId_idx" ON "Purchase"("userId");
CREATE INDEX "Purchase_experienceId_idx" ON "Purchase"("experienceId");
CREATE INDEX "Purchase_stripePaymentId_idx" ON "Purchase"("stripePaymentId");

-- ============================================
-- ANALYTICS TABLES
-- ============================================

CREATE TABLE "CreatorAnalytics" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "plays" INTEGER NOT NULL DEFAULT 0,
    "completions" INTEGER NOT NULL DEFAULT 0,
    "uniqueViewers" INTEGER NOT NULL DEFAULT 0,
    "avgPlayTime" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    CONSTRAINT "CreatorAnalytics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreatorAnalytics_experienceId_date_key" ON "CreatorAnalytics"("experienceId", "date");
CREATE INDEX "CreatorAnalytics_experienceId_idx" ON "CreatorAnalytics"("experienceId");
CREATE INDEX "CreatorAnalytics_date_idx" ON "CreatorAnalytics"("date");

-- ============================================
-- CREATOR PROFILE TABLES
-- ============================================

CREATE TABLE "SocialLink" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SocialLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SocialLink_creatorId_platform_key" ON "SocialLink"("creatorId", "platform");
CREATE INDEX "SocialLink_creatorId_idx" ON "SocialLink"("creatorId");

-- ============================================
-- PROCESSING ENGINE TABLES
-- ============================================

CREATE TABLE "ProcessingJob" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "stage" "JobStage",
    "progress" INTEGER NOT NULL DEFAULT 0,
    "totalSteps" INTEGER NOT NULL DEFAULT 5000,
    "maxSplats" INTEGER NOT NULL DEFAULT 10000000,
    "imagePercentage" INTEGER NOT NULL DEFAULT 50,
    "fps" INTEGER NOT NULL DEFAULT 10,
    "duration" INTEGER NOT NULL DEFAULT 10,
    "sourceVideoUrl" TEXT NOT NULL,
    "outputPlyUrl" TEXT,
    "outputCamerasUrl" TEXT,
    "outputThumbnail" TEXT,
    "outputPreview" TEXT,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "processingTime" INTEGER,
    "workerId" TEXT,
    "lastHeartbeat" TIMESTAMP(3),
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    CONSTRAINT "ProcessingJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProcessingJob_experienceId_key" ON "ProcessingJob"("experienceId");
CREATE INDEX "ProcessingJob_status_idx" ON "ProcessingJob"("status");
CREATE INDEX "ProcessingJob_queuedAt_idx" ON "ProcessingJob"("queuedAt");

-- ============================================
-- SUBSCRIPTION & CREDITS TABLES
-- ============================================

CREATE TABLE "CreatorSubscription" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripeSubscriptionId" TEXT,
    "stripeCustomerId" TEXT,
    "monthlyCredits" INTEGER NOT NULL DEFAULT 0,
    "rolloverCredits" INTEGER NOT NULL DEFAULT 0,
    "creditsUsedThisMonth" INTEGER NOT NULL DEFAULT 0,
    "creditResetDate" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CreatorSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreatorSubscription_creatorId_key" ON "CreatorSubscription"("creatorId");
CREATE INDEX "CreatorSubscription_stripeSubscriptionId_idx" ON "CreatorSubscription"("stripeSubscriptionId");
CREATE INDEX "CreatorSubscription_stripeCustomerId_idx" ON "CreatorSubscription"("stripeCustomerId");

CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "type" "CreditTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CreditTransaction_subscriptionId_idx" ON "CreditTransaction"("subscriptionId");
CREATE INDEX "CreditTransaction_type_idx" ON "CreditTransaction"("type");
CREATE INDEX "CreditTransaction_createdAt_idx" ON "CreditTransaction"("createdAt");

CREATE TABLE "PublishFee" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "stripePaymentId" TEXT,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "waived" BOOLEAN NOT NULL DEFAULT false,
    "waivedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    CONSTRAINT "PublishFee_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PublishFee_experienceId_key" ON "PublishFee"("experienceId");
CREATE INDEX "PublishFee_creatorId_idx" ON "PublishFee"("creatorId");
CREATE INDEX "PublishFee_stripePaymentId_idx" ON "PublishFee"("stripePaymentId");

-- ============================================
-- PROMO CODES & BETA ACCESS TABLES
-- ============================================

CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "PromoCodeType" NOT NULL,
    "description" TEXT,
    "creditAmount" INTEGER,
    "discountPercent" INTEGER,
    "discountAmount" DECIMAL(10,2),
    "trialDays" INTEGER,
    "maxRedemptions" INTEGER,
    "redemptionCount" INTEGER NOT NULL DEFAULT 0,
    "maxPerUser" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresEmail" TEXT,
    "requiresDomain" TEXT,
    "tier" "SubscriptionTier",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");
CREATE INDEX "PromoCode_code_idx" ON "PromoCode"("code");
CREATE INDEX "PromoCode_isActive_idx" ON "PromoCode"("isActive");

CREATE TABLE "PromoRedemption" (
    "id" TEXT NOT NULL,
    "promoCodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creditsGranted" INTEGER,
    "accessGranted" TEXT,
    CONSTRAINT "PromoRedemption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromoRedemption_promoCodeId_userId_key" ON "PromoRedemption"("promoCodeId", "userId");
CREATE INDEX "PromoRedemption_userId_idx" ON "PromoRedemption"("userId");

CREATE TABLE "BetaAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "grantedBy" TEXT,
    "promoCodeId" TEXT,
    "notes" TEXT,
    "features" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    CONSTRAINT "BetaAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BetaAccess_userId_key" ON "BetaAccess"("userId");
CREATE INDEX "BetaAccess_userId_idx" ON "BetaAccess"("userId");
CREATE INDEX "BetaAccess_isActive_idx" ON "BetaAccess"("isActive");

-- ============================================
-- APP VERSIONING TABLES
-- ============================================

CREATE TABLE "AppVersion" (
    "id" TEXT NOT NULL,
    "appType" "AppType" NOT NULL,
    "version" TEXT NOT NULL,
    "updateType" "UpdateType" NOT NULL,
    "releaseNotes" TEXT,
    "downloadUrl" TEXT,
    "checksum" TEXT,
    "minOsVersion" TEXT,
    "minVersion" TEXT,
    "isLatest" BOOLEAN NOT NULL DEFAULT false,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPct" INTEGER NOT NULL DEFAULT 100,
    "releasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AppVersion_appType_version_key" ON "AppVersion"("appType", "version");
CREATE INDEX "AppVersion_appType_isLatest_idx" ON "AppVersion"("appType", "isLatest");

CREATE TABLE "UserAppVersion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "appType" "AppType" NOT NULL,
    "version" TEXT NOT NULL,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserAppVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserAppVersion_userId_appType_key" ON "UserAppVersion"("userId", "appType");
CREATE INDEX "UserAppVersion_appType_version_idx" ON "UserAppVersion"("appType", "version");

CREATE TABLE "UpdateNotification" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "imageUrl" TEXT,
    "actionUrl" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UpdateNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UpdateNotification_versionId_idx" ON "UpdateNotification"("versionId");

CREATE TABLE "NotificationDismissal" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationDismissal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationDismissal_notificationId_userId_key" ON "NotificationDismissal"("notificationId", "userId");
CREATE INDEX "NotificationDismissal_userId_idx" ON "NotificationDismissal"("userId");

-- ============================================
-- SYSTEM CONFIG TABLE
-- ============================================

CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");
CREATE INDEX "SystemConfig_key_idx" ON "SystemConfig"("key");

-- ============================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================

ALTER TABLE "Creator" ADD CONSTRAINT "Creator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Series" ADD CONSTRAINT "Series_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlayHistory" ADD CONSTRAINT "PlayHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlayHistory" ADD CONSTRAINT "PlayHistory_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConnectedAccount" ADD CONSTRAINT "ConnectedAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreatorAnalytics" ADD CONSTRAINT "CreatorAnalytics_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialLink" ADD CONSTRAINT "SocialLink_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProcessingJob" ADD CONSTRAINT "ProcessingJob_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreatorSubscription" ADD CONSTRAINT "CreatorSubscription_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "CreatorSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromoRedemption" ADD CONSTRAINT "PromoRedemption_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationDismissal" ADD CONSTRAINT "NotificationDismissal_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "UpdateNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
