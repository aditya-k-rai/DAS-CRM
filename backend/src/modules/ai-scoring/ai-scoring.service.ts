import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScoreTier } from '@prisma/client';

interface LeadActivityData {
  totalActivities: number;
  emailsSent: number;
  emailsOpened: number;
  callsMade: number;
  callsConnected: number;
  meetingsScheduled: number;
  tasksCompleted: number;
  daysSinceLastActivity: number;
  quotationsShared: number;
  quotationsViewed: number;
}

interface ScoringFactors {
  budgetScore: number;
  intentScore: number;
  engagementScore: number;
  productFitScore: number;
  responseScore: number;
}

@Injectable()
export class AIScoringService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get or create AI score for a lead
   */
  async getLeadScore(organizationId: string, leadId: string) {
    const leadAIScore = await this.prisma.leadAIScore.findUnique({
      where: { leadId },
      include: { lead: { select: { firstName: true, lastName: true } } },
    });
    return leadAIScore;
  }

  /**
   * Get all lead scores for an organization with pagination
   */
  async getAllLeadScores(organizationId: string, tier?: ScoreTier, limit = 50, page = 1) {
    const where: any = { organizationId };
    if (tier) where.tier = tier;

    const [scores, total] = await Promise.all([
      this.prisma.leadAIScore.findMany({
        where,
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              status: { select: { name: true, color: true } },
              owner: { select: { firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { totalScore: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.leadAIScore.count({ where }),
    ]);

    return { data: scores, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Calculate AI score for a single lead
   */
  async calculateLeadScore(organizationId: string, leadId: string) {
    // Get lead with activities
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, organizationId },
      include: {
        activities: true,
        quotations: true,
        tasks: true,
        meetings: true,
        company: true,
      },
    });

    if (!lead) throw new NotFoundException('Lead not found');

    // Get organization scoring config
    let config = await this.prisma.aIScoreConfig.findUnique({
      where: { organizationId },
    });

    // Create default config if not exists
    if (!config) {
      config = await this.prisma.aIScoreConfig.create({
        data: { organizationId },
      });
    }

    // Gather activity data
    const activityData = this.gatherActivityData(lead.activities, lead.quotations, lead.tasks, lead.meetings);

    // Calculate individual scores
    const factors = this.calculateFactors(lead, activityData, config);

    // Calculate weighted total score
    const totalScore = this.calculateWeightedScore(factors, config);

    // Determine tier
    const tier = this.determineTier(totalScore, config);

    // Generate analysis
    const analysis = this.generateAnalysis(lead, activityData, factors);

    // Upsert the score
    const aiScore = await this.prisma.leadAIScore.upsert({
      where: { leadId },
      create: {
        leadId,
        organizationId,
        totalScore,
        tier,
        budgetScore: factors.budgetScore,
        intentScore: factors.intentScore,
        engagementScore: factors.engagementScore,
        productFitScore: factors.productFitScore,
        responseScore: factors.responseScore,
        analysisSummary: analysis.summary,
        topFactors: analysis.topFactors,
        riskFactors: analysis.riskFactors,
        recommendations: analysis.recommendations,
      },
      update: {
        totalScore,
        tier,
        budgetScore: factors.budgetScore,
        intentScore: factors.intentScore,
        engagementScore: factors.engagementScore,
        productFitScore: factors.productFitScore,
        responseScore: factors.responseScore,
        analysisSummary: analysis.summary,
        topFactors: analysis.topFactors,
        riskFactors: analysis.riskFactors,
        recommendations: analysis.recommendations,
        lastCalculatedAt: new Date(),
      },
    });

    return aiScore;
  }

  /**
   * Recalculate scores for all leads in an organization
   */
  async recalculateAllScores(organizationId: string) {
    const leads = await this.prisma.lead.findMany({
      where: { organizationId },
      select: { id: true },
    });

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const lead of leads) {
      try {
        await this.calculateLeadScore(organizationId, lead.id);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Lead ${lead.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }

  /**
   * Get or create AI score configuration for organization
   */
  async getScoreConfig(organizationId: string) {
    let config = await this.prisma.aIScoreConfig.findUnique({
      where: { organizationId },
    });

    if (!config) {
      config = await this.prisma.aIScoreConfig.create({
        data: { organizationId },
      });
    }

    return config;
  }

  /**
   * Update AI score configuration
   */
  async updateScoreConfig(
    organizationId: string,
    data: {
      budgetWeight?: number;
      intentWeight?: number;
      engagementWeight?: number;
      productFitWeight?: number;
      responseWeight?: number;
      hotThresholdMin?: number;
      warmThresholdMin?: number;
      coldThresholdMin?: number;
      showOnLeadsTable?: boolean;
      showBreakdownDetail?: boolean;
      autoRecalculate?: boolean;
    },
  ) {
    // Validate weights sum to 100
    const weights = ['budgetWeight', 'intentWeight', 'engagementWeight', 'productFitWeight', 'responseWeight'] as const;
    const currentConfig = await this.getScoreConfig(organizationId);
    const newWeights = weights.reduce((acc, w) => {
      acc[w] = data[w] ?? currentConfig[w];
      return acc;
    }, {} as Record<typeof weights[number], number>);

    // Validate threshold order
    if (data.hotThresholdMin !== undefined && data.hotThresholdMin <= (data.warmThresholdMin ?? currentConfig.warmThresholdMin)) {
      throw new Error('Hot threshold must be greater than warm threshold');
    }
    if (data.warmThresholdMin !== undefined && data.warmThresholdMin <= (data.coldThresholdMin ?? currentConfig.coldThresholdMin)) {
      throw new Error('Warm threshold must be greater than cold threshold');
    }

    const config = await this.prisma.aIScoreConfig.update({
      where: { organizationId },
      data,
    });

    // If auto-recalculate is enabled, recalculate all scores
    if (config.autoRecalculate) {
      await this.recalculateAllScores(organizationId);
    }

    return config;
  }

  /**
   * Gather activity data for scoring
   */
  private gatherActivityData(activities: any[], quotations: any[], tasks: any[], meetings: any[]) {
    const now = new Date();
    const lastActivity = activities[0];
    const daysSinceLastActivity = lastActivity
      ? Math.floor((now.getTime() - new Date(lastActivity.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    return {
      totalActivities: activities.length,
      emailsSent: activities.filter((a) => a.type === 'EMAIL').length,
      emailsOpened: activities.filter((a) => a.type === 'EMAIL' && a.metadata && (a.metadata as any).opened).length,
      callsMade: activities.filter((a) => a.type === 'CALL').length,
      callsConnected: activities.filter((a) => a.type === 'CALL' && a.metadata && (a.metadata as any).connected).length,
      meetingsScheduled: meetings.length,
      tasksCompleted: tasks.filter((t) => t.isCompleted).length,
      daysSinceLastActivity,
      quotationsShared: quotations.length,
      quotationsViewed: quotations.filter((q) => q.status === 'SENT').length,
    };
  }

  /**
   * Calculate individual scoring factors (0-100 scale)
   */
  private calculateFactors(lead: any, activityData: LeadActivityData, config: any): ScoringFactors {
    // Budget Score (based on deal value / custom fields)
    let budgetScore = 0;
    const dealValue = (lead.customFields as any)?.dealValue || 0;
    if (dealValue >= 1000000) budgetScore = 95;
    else if (dealValue >= 500000) budgetScore = 85;
    else if (dealValue >= 250000) budgetScore = 75;
    else if (dealValue >= 100000) budgetScore = 60;
    else if (dealValue >= 50000) budgetScore = 40;
    else if (dealValue > 0) budgetScore = 20;
    // If no deal value, use engagement heuristics
    else if (lead.quotations?.length > 0) budgetScore = 50;

    // Intent Score (based on engagement signals)
    let intentScore = 0;
    if (activityData.quotationsShared > 0) intentScore += 30;
    if (activityData.meetingsScheduled > 0) intentScore += 25;
    if (lead.status?.isWon) intentScore = 100;
    // Active pipeline progression
    if (lead.activities?.length > 5) intentScore += 20;
    if (lead.activities?.length > 10) intentScore += 15;
    if (lead.company) intentScore += 10; // Has company = serious buyer
    intentScore = Math.min(100, intentScore);

    // Engagement Score (activity frequency and quality)
    let engagementScore = 0;
    // Activity volume
    if (activityData.totalActivities >= 20) engagementScore = 90;
    else if (activityData.totalActivities >= 10) engagementScore = 75;
    else if (activityData.totalActivities >= 5) engagementScore = 55;
    else if (activityData.totalActivities >= 2) engagementScore = 35;
    else if (activityData.totalActivities >= 1) engagementScore = 20;

    // Recency bonus (engaged recently)
    if (activityData.daysSinceLastActivity <= 1) engagementScore = Math.min(100, engagementScore + 10);
    else if (activityData.daysSinceLastActivity <= 3) engagementScore = Math.min(100, engagementScore + 5);
    else if (activityData.daysSinceLastActivity > 14) engagementScore = Math.max(0, engagementScore - 20);

    // Product Fit Score (based on interactions and requirements)
    let productFitScore = 50; // Default
    if (activityData.quotationsShared > 0) productFitScore += 20;
    if (lead.quotations?.some((q: any) => (q.metadata as any)?.productShared)) productFitScore += 15;
    if ((lead.customFields as any)?.requirement) productFitScore += 10;
    if ((lead.customFields as any)?.useCase) productFitScore += 5;
    productFitScore = Math.min(100, productFitScore);

    // Response Score (how quickly and consistently they respond)
    let responseScore = 0;
    if (activityData.callsConnected > 0) responseScore += 40;
    if (activityData.emailsOpened > 0) responseScore += 30;
    if (activityData.daysSinceLastActivity <= 2) responseScore += 30;
    else if (activityData.daysSinceLastActivity <= 7) responseScore += 15;
    else if (activityData.daysSinceLastActivity > 14) responseScore = 0;
    responseScore = Math.min(100, responseScore);

    return { budgetScore, intentScore, engagementScore, productFitScore, responseScore };
  }

  /**
   * Calculate weighted total score (0-10 scale)
   */
  private calculateWeightedScore(factors: ScoringFactors, config: any): number {
    const total = (
      factors.budgetScore * config.budgetWeight +
      factors.intentScore * config.intentWeight +
      factors.engagementScore * config.engagementWeight +
      factors.productFitScore * config.productFitWeight +
      factors.responseScore * config.responseWeight
    ) / 100;

    // Convert from 0-100 to 0-10 scale
    return Math.round(total / 10 * 100) / 100;
  }

  /**
   * Determine tier based on score and thresholds
   */
  private determineTier(score: number, config: any): ScoreTier {
    if (score >= config.hotThresholdMin) return 'HOT';
    if (score >= config.warmThresholdMin) return 'WARM';
    if (score >= config.coldThresholdMin) return 'COLD';
    return 'LOW';
  }

  /**
   * Generate analysis and recommendations
   */
  private generateAnalysis(lead: any, activityData: LeadActivityData, factors: ScoringFactors) {
    const topFactors: string[] = [];
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    // Identify top factors
    if (factors.budgetScore >= 80) topFactors.push('High budget potential (₹5L+)');
    else if (factors.budgetScore >= 60) topFactors.push('Medium budget range (₹1L-5L)');
    if (factors.intentScore >= 80) topFactors.push('Strong buying intent signals');
    if (factors.engagementScore >= 80) topFactors.push('Highly engaged with sales team');
    if (factors.productFitScore >= 80) topFactors.push('Excellent product-requirement match');
    if (activityData.meetingsScheduled > 0) topFactors.push('Demo/meeting scheduled');
    if (activityData.quotationsShared > 0) topFactors.push('Quotation already shared');

    // Identify risk factors
    if (activityData.daysSinceLastActivity > 7) riskFactors.push(`No activity for ${activityData.daysSinceLastActivity} days`);
    if (activityData.callsConnected === 0 && activityData.callsMade > 0) riskFactors.push('Call attempts but no connections');
    if (factors.responseScore < 30) riskFactors.push('Low response rate to outreach');
    if (factors.engagementScore < 40) riskFactors.push('Limited engagement with content');

    // Generate recommendations
    if (riskFactors.length > 0 && activityData.daysSinceLastActivity > 7) {
      recommendations.push('Schedule a follow-up call immediately');
    }
    if (factors.productFitScore >= 80 && !activityData.quotationsShared) {
      recommendations.push('Share customized quotation to capitalize on fit');
    }
    if (factors.budgetScore >= 70 && !lead.company) {
      recommendations.push('Gather company details to verify budget authority');
    }
    if (factors.intentScore < 50) {
      recommendations.push('Share case studies and testimonials to build trust');
    }
    if (activityData.quotationsViewed > 0) {
      recommendations.push('Quotation was viewed - good time to close with offer');
    }
    if (recommendations.length === 0) {
      recommendations.push('Continue nurturing with regular touchpoints');
    }

    // Generate summary
    const tierSummary = {
      HOT: 'This is a high-priority lead showing strong signals across all metrics.',
      WARM: 'This lead shows moderate interest and engagement. Focus on building momentum.',
      COLD: 'This lead needs more nurturing. Consider adjusting outreach strategy.',
      LOW: 'This lead has limited engagement. Focus on other high-priority prospects.',
    };

    return {
      summary: tierSummary[this.determineTierFromScore(factors)] || tierSummary.COLD,
      topFactors,
      riskFactors,
      recommendations,
    };
  }

  private determineTierFromScore(factors: ScoringFactors): ScoreTier {
    const avg = (factors.budgetScore + factors.intentScore + factors.engagementScore + factors.productFitScore + factors.responseScore) / 5;
    if (avg >= 70) return 'HOT';
    if (avg >= 50) return 'WARM';
    if (avg >= 30) return 'COLD';
    return 'LOW';
  }
}
