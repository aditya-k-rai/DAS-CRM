-- ============================================================
-- NexCRM Auth, Billing & Role Transition Migration
-- Add new tables for: super_admins, super_admin_otps,
-- company_registration_keys, user_invite_keys,
-- role_transitions, activity_export_logs, plan_upgrade_requests
-- Also update organizations and subscriptions tables
-- ============================================================

-- 1. NEW ENUM TYPES
DO $$ BEGIN
  CREATE TYPE "KeyStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'REVOKED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "RoleTransitionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVERTED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "PlanUpgradeStatus" AS ENUM ('PENDING_PAYMENT', 'PENDING_SUPER_ADMIN_APPROVAL', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Add new PlanTier values (Postgres enum ALTER)
ALTER TYPE "PlanTier" ADD VALUE IF NOT EXISTS 'FREE_TRIAL';
ALTER TYPE "PlanTier" ADD VALUE IF NOT EXISTS 'STARTER';
ALTER TYPE "PlanTier" ADD VALUE IF NOT EXISTS 'ENTERPRISE';

-- Add new NotificationType values
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ROLE_TRANSITION';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PLAN_UPGRADE';

-- 2. UPDATE ORGANIZATIONS TABLE (add new columns)
ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "adminName"       TEXT,
  ADD COLUMN IF NOT EXISTS "adminEmail"      TEXT,
  ADD COLUMN IF NOT EXISTS "phone"           TEXT,
  ADD COLUMN IF NOT EXISTS "city"            TEXT,
  ADD COLUMN IF NOT EXISTS "state"           TEXT,
  ADD COLUMN IF NOT EXISTS "gstNumber"       TEXT,
  ADD COLUMN IF NOT EXISTS "companyType"     TEXT,
  ADD COLUMN IF NOT EXISTS "sector"          TEXT,
  ADD COLUMN IF NOT EXISTS "registrationKeyId" TEXT;

-- 3. UPDATE SUBSCRIPTIONS TABLE
ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "trialStartsAt"         TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "trialExpiresAt"         TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "isTrialActive"          BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "whatsAppEnabled"        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "emailMarketingEnabled"  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "aiEnabled"              BOOLEAN NOT NULL DEFAULT false;

-- 4. SUPER ADMINS TABLE
CREATE TABLE IF NOT EXISTS "super_admins" (
  "id"        TEXT NOT NULL,
  "email"     TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "super_admins_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "super_admins_email_key" ON "super_admins"("email");

-- 5. SUPER ADMIN OTPs TABLE
CREATE TABLE IF NOT EXISTS "super_admin_otps" (
  "id"           TEXT NOT NULL,
  "superAdminId" TEXT NOT NULL,
  "otpHash"      TEXT NOT NULL,
  "expiresAt"    TIMESTAMP(3) NOT NULL,
  "usedAt"       TIMESTAMP(3),
  "ipAddress"    TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "super_admin_otps_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "super_admin_otps"
  ADD CONSTRAINT "super_admin_otps_superAdminId_fkey"
  FOREIGN KEY ("superAdminId") REFERENCES "super_admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. COMPANY REGISTRATION KEYS TABLE
CREATE TABLE IF NOT EXISTS "company_registration_keys" (
  "id"                    TEXT NOT NULL,
  "key"                   TEXT NOT NULL,
  "qrCodeDataUrl"         TEXT NOT NULL,
  "createdBySuperAdminId" TEXT NOT NULL,
  "planTier"              "PlanTier" NOT NULL DEFAULT 'FREE_TRIAL',
  "memberLimit"           INTEGER NOT NULL DEFAULT 6,
  "validityDays"          INTEGER NOT NULL DEFAULT 7,
  "whatsAppEnabled"       BOOLEAN NOT NULL DEFAULT false,
  "emailMarketingEnabled" BOOLEAN NOT NULL DEFAULT false,
  "aiEnabled"             BOOLEAN NOT NULL DEFAULT false,
  "status"                "KeyStatus" NOT NULL DEFAULT 'ACTIVE',
  "usedByOrganizationId"  TEXT,
  "expiresAt"             TIMESTAMP(3) NOT NULL,
  "usedAt"                TIMESTAMP(3),
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "company_registration_keys_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "company_registration_keys_key_key" ON "company_registration_keys"("key");
CREATE UNIQUE INDEX IF NOT EXISTS "company_registration_keys_usedByOrganizationId_key" ON "company_registration_keys"("usedByOrganizationId");
ALTER TABLE "company_registration_keys"
  ADD CONSTRAINT "company_registration_keys_createdBySuperAdminId_fkey"
  FOREIGN KEY ("createdBySuperAdminId") REFERENCES "super_admins"("id") ON UPDATE CASCADE;

-- 7. USER INVITE KEYS TABLE
CREATE TABLE IF NOT EXISTS "user_invite_keys" (
  "id"             TEXT NOT NULL,
  "key"            TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "assignedRole"   "UserRole" NOT NULL DEFAULT 'SALES',
  "validityDays"   INTEGER NOT NULL DEFAULT 7,
  "status"         "KeyStatus" NOT NULL DEFAULT 'ACTIVE',
  "usedByUserId"   TEXT,
  "expiresAt"      TIMESTAMP(3) NOT NULL,
  "usedAt"         TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_invite_keys_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_invite_keys_key_key" ON "user_invite_keys"("key");
CREATE UNIQUE INDEX IF NOT EXISTS "user_invite_keys_usedByUserId_key" ON "user_invite_keys"("usedByUserId");

-- 8. ROLE TRANSITIONS TABLE
CREATE TABLE IF NOT EXISTS "role_transitions" (
  "id"                  TEXT NOT NULL,
  "organizationId"      TEXT NOT NULL,
  "userId"              TEXT NOT NULL,
  "oldRole"             "UserRole" NOT NULL,
  "newRole"             "UserRole" NOT NULL,
  "initiatedByAdminId"  TEXT NOT NULL,
  "status"              "RoleTransitionStatus" NOT NULL DEFAULT 'PENDING',
  "initiatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"           TIMESTAMP(3) NOT NULL,
  "acceptedAt"          TIMESTAMP(3),
  "revertedAt"          TIMESTAMP(3),
  "userNotifiedAt"      TIMESTAMP(3),
  "adminNotifiedAt"     TIMESTAMP(3),
  CONSTRAINT "role_transitions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "role_transitions_userId_status_idx" ON "role_transitions"("userId", "status");

-- 9. ACTIVITY EXPORT LOGS TABLE
CREATE TABLE IF NOT EXISTS "activity_export_logs" (
  "id"                 TEXT NOT NULL,
  "roleTransitionId"   TEXT NOT NULL,
  "userId"             TEXT NOT NULL,
  "organizationId"     TEXT NOT NULL,
  "storagePath"        TEXT NOT NULL,
  "downloadUrl"        TEXT NOT NULL,
  "downloadExpiresAt"  TIMESTAMP(3) NOT NULL,
  "sentToUserEmail"    BOOLEAN NOT NULL DEFAULT false,
  "sentToAdminEmail"   BOOLEAN NOT NULL DEFAULT false,
  "sentAt"             TIMESTAMP(3),
  "activitiesCount"    INTEGER NOT NULL DEFAULT 0,
  "generatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "activity_export_logs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "activity_export_logs_roleTransitionId_key" ON "activity_export_logs"("roleTransitionId");
ALTER TABLE "activity_export_logs"
  ADD CONSTRAINT "activity_export_logs_roleTransitionId_fkey"
  FOREIGN KEY ("roleTransitionId") REFERENCES "role_transitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 10. PLAN UPGRADE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS "plan_upgrade_requests" (
  "id"                     TEXT NOT NULL,
  "subscriptionId"         TEXT NOT NULL,
  "organizationId"         TEXT NOT NULL,
  "requestedPlan"          "PlanTier" NOT NULL,
  "requestedMemberLimit"   INTEGER NOT NULL,
  "addOnSeats"             INTEGER NOT NULL DEFAULT 0,
  "razorpayOrderId"        TEXT,
  "razorpayPaymentId"      TEXT,
  "razorpaySignature"      TEXT,
  "paymentVerified"        BOOLEAN NOT NULL DEFAULT false,
  "amountPaise"            INTEGER NOT NULL DEFAULT 0,
  "currency"               TEXT NOT NULL DEFAULT 'INR',
  "status"                 "PlanUpgradeStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
  "reviewedBySuperAdminId" TEXT,
  "reviewedAt"             TIMESTAMP(3),
  "rejectionReason"        TEXT,
  "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"              TIMESTAMP(3) NOT NULL,
  CONSTRAINT "plan_upgrade_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "plan_upgrade_requests_organizationId_status_idx" ON "plan_upgrade_requests"("organizationId", "status");
ALTER TABLE "plan_upgrade_requests"
  ADD CONSTRAINT "plan_upgrade_requests_subscriptionId_fkey"
  FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_upgrade_requests"
  ADD CONSTRAINT "plan_upgrade_requests_reviewedBySuperAdminId_fkey"
  FOREIGN KEY ("reviewedBySuperAdminId") REFERENCES "super_admins"("id") ON UPDATE CASCADE;
