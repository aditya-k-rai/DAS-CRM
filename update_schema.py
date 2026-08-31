#!/usr/bin/env python3
import os

# Read the original schema
with open('backend/prisma/schema.prisma', 'r', encoding='utf-8') as f:
    content = f.read()

# New models to insert
new_models = '''
// ─────────────────────────────────────────────────────────────────────
// AI LEAD SCORING
// ─────────────────────────────────────────────────────────────────────

enum ScoreTier {
  HOT
  WARM
  COLD
  LOW
}

model LeadAIScore {
  id                String    @id @default(cuid())
  leadId            String
  organizationId    String
  // Overall Score (0-10)
  totalScore        Float     @default(0)
  tier              ScoreTier @default(LOW)
  // Score Breakdown Components (0-100 each, displayed as 0-10 scale)
  budgetScore       Float     @default(0)
  intentScore       Float     @default(0)
  engagementScore   Float     @default(0)
  productFitScore   Float     @default(0)
  responseScore     Float     @default(0)
  // Analysis metadata
  analysisSummary   String?
  topFactors        Json      @default("[]")
  riskFactors       Json      @default("[]")
  recommendations   Json      @default("[]")
  // Timestamps
  lastCalculatedAt  DateTime  @default(now())
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  lead         Lead         @relation(fields: [leadId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([leadId])
  @@index([organizationId, tier])
  @@index([organizationId, totalScore])
  @@map("lead_ai_scores")
}

model AIScoreConfig {
  id                   String   @id @default(cuid())
  organizationId       String   @unique
  // Weight configuration for each metric (must sum to 100)
  budgetWeight         Float    @default(20)
  intentWeight         Float    @default(25)
  engagementWeight     Float    @default(20)
  productFitWeight     Float    @default(20)
  responseWeight       Float    @default(15)
  // Tier thresholds (in 0-10 scale)
  hotThresholdMin      Float    @default(9)
  warmThresholdMin     Float    @default(7)
  coldThresholdMin     Float    @default(4)
  // Display settings
  showOnLeadsTable     Boolean  @default(true)
  showBreakdownDetail  Boolean  @default(true)
  // Auto-recalculate on activity
  autoRecalculate      Boolean  @default(true)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@map("ai_score_configs")
}

'''

# Find the insertion point - before "model LeadSource {"
insert_marker = 'model LeadSource {'
insert_pos = content.find(insert_marker)

if insert_pos != -1:
    new_content = content[:insert_pos] + new_models + content[insert_pos:]
    with open('backend/prisma/schema.prisma', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Schema updated successfully!")
else:
    print("ERROR: Could not find insertion point")
