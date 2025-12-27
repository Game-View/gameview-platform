// Database package - exports Prisma client or mock for development
// When Prisma binaries can't be downloaded (e.g., network restrictions),
// this exports mock implementations that allow the app to build and run
// with mock data mode.

let prismaClient: any;
let PrismaClientExport: any;

try {
  // Try to import the real Prisma client
  const prismaModule = require("@prisma/client");
  PrismaClientExport = prismaModule.PrismaClient;

  // PrismaClient singleton for serverless environments
  const globalForPrisma = globalThis as unknown as {
    prisma: any | undefined;
  };

  prismaClient =
    globalForPrisma.prisma ??
    new PrismaClientExport({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaClient;
  }
} catch {
  // Prisma client not generated - use mock
  console.warn(
    "[database] Prisma client not available, using mock. Run 'prisma generate' to enable database."
  );

  const createMockDelegate = () => ({
    findUnique: async () => null,
    findFirst: async () => null,
    findMany: async () => [],
    create: async (args: any) => args.data,
    update: async (args: any) => args.data,
    delete: async () => ({}),
    upsert: async (args: any) => args.create,
    count: async () => 0,
  });

  prismaClient = {
    $connect: async () => {},
    $disconnect: async () => {},
    $transaction: async (fn: any) => fn(prismaClient),
    user: createMockDelegate(),
    creator: createMockDelegate(),
    experience: createMockDelegate(),
    series: createMockDelegate(),
    userInterest: createMockDelegate(),
    follow: createMockDelegate(),
    playHistory: createMockDelegate(),
    wishlist: createMockDelegate(),
    connectedAccount: createMockDelegate(),
    purchase: createMockDelegate(),
    creatorAnalytics: createMockDelegate(),
    socialLink: createMockDelegate(),
    processingJob: createMockDelegate(),
    creatorSubscription: createMockDelegate(),
    creditTransaction: createMockDelegate(),
    publishFee: createMockDelegate(),
    promoCode: createMockDelegate(),
    promoRedemption: createMockDelegate(),
    betaAccess: createMockDelegate(),
    appVersion: createMockDelegate(),
    userAppVersion: createMockDelegate(),
    updateNotification: createMockDelegate(),
    notificationDismissal: createMockDelegate(),
    systemConfig: createMockDelegate(),
  };

  PrismaClientExport = function () {
    return prismaClient;
  };
}

export const prisma = prismaClient;
export const db = prismaClient;
export const PrismaClient = PrismaClientExport;

// Type definitions for Prisma client - this allows `type { PrismaClient }` imports
export type PrismaClient = {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  $transaction<T>(fn: (prisma: any) => Promise<T>): Promise<T>;
  user: any;
  creator: any;
  experience: any;
  series: any;
  userInterest: any;
  follow: any;
  playHistory: any;
  wishlist: any;
  connectedAccount: any;
  purchase: any;
  creatorAnalytics: any;
  socialLink: any;
  processingJob: any;
  creatorSubscription: any;
  creditTransaction: any;
  publishFee: any;
  promoCode: any;
  promoRedemption: any;
  betaAccess: any;
  appVersion: any;
  userAppVersion: any;
  updateNotification: any;
  notificationDismissal: any;
  systemConfig: any;
};

// Type helper for transactions
export type TransactionClient = PrismaClient;

// Re-export enums (these are always available as they're just strings)
export enum UserRole {
  PLAYER = "PLAYER",
  CREATOR = "CREATOR",
  ADMIN = "ADMIN",
}

export enum Category {
  ENTERTAINMENT = "ENTERTAINMENT",
  EDUCATION = "EDUCATION",
  EXPLORATION = "EXPLORATION",
}

export enum ExperienceStatus {
  DRAFT = "DRAFT",
  PROCESSING = "PROCESSING",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export enum AgeRating {
  E = "E",
  E10 = "E10",
  T = "T",
  M = "M",
}

export enum Platform {
  YOUTUBE = "YOUTUBE",
  TIKTOK = "TIKTOK",
  TWITCH = "TWITCH",
  TWITTER = "TWITTER",
  INSTAGRAM = "INSTAGRAM",
}

export enum PurchaseStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  REFUNDED = "REFUNDED",
  FAILED = "FAILED",
}

export enum JobStatus {
  QUEUED = "QUEUED",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export enum JobStage {
  DOWNLOADING = "DOWNLOADING",
  COLMAP = "COLMAP",
  SPLATTING = "SPLATTING",
  UPLOADING = "UPLOADING",
  FINALIZING = "FINALIZING",
}

export enum SubscriptionTier {
  FREE = "FREE",
  STARTER = "STARTER",
  PRO = "PRO",
  ENTERPRISE = "ENTERPRISE",
}

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  PAST_DUE = "PAST_DUE",
  CANCELLED = "CANCELLED",
  TRIALING = "TRIALING",
}

export enum CreditTransactionType {
  MONTHLY_GRANT = "MONTHLY_GRANT",
  PURCHASE = "PURCHASE",
  PUBLISH_USED = "PUBLISH_USED",
  PROMO_CODE = "PROMO_CODE",
  REFUND = "REFUND",
  ADMIN_ADJUSTMENT = "ADMIN_ADJUSTMENT",
  ROLLOVER = "ROLLOVER",
}

export enum PromoCodeType {
  BETA_ACCESS = "BETA_ACCESS",
  PUBLISH_CREDITS = "PUBLISH_CREDITS",
  SUBSCRIPTION_TRIAL = "SUBSCRIPTION_TRIAL",
  DISCOUNT = "DISCOUNT",
}

export enum AppType {
  DESKTOP = "DESKTOP",
  STUDIO = "STUDIO",
  PLAYER = "PLAYER",
}

export enum UpdateType {
  PATCH = "PATCH",
  MINOR = "MINOR",
  MAJOR = "MAJOR",
  SECURITY = "SECURITY",
}
