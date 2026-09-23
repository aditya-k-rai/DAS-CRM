-- ============================================================
-- Migration: Add panNumber column and uniqueness lookup indices
-- to organizations table
-- ============================================================

ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "panNumber" TEXT;

CREATE INDEX IF NOT EXISTS "organizations_panNumber_idx" ON "organizations"("panNumber");
CREATE INDEX IF NOT EXISTS "organizations_gstNumber_idx" ON "organizations"("gstNumber");
CREATE INDEX IF NOT EXISTS "organizations_phone_idx" ON "organizations"("phone");
CREATE INDEX IF NOT EXISTS "organizations_adminEmail_idx" ON "organizations"("adminEmail");
