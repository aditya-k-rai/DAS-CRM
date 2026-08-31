import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AIScoringService } from './ai-scoring.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ScoreTier } from '@prisma/client';

@Controller('ai-scoring')
@UseGuards(JwtAuthGuard)
export class AIScoringController {
  constructor(
    private readonly aiScoringService: AIScoringService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get AI score configuration for the organization
   */
  @Get('config')
  async getConfig(@Request() req: any) {
    const organizationId = req.user.organizationId;
    return this.aiScoringService.getScoreConfig(organizationId);
  }

  /**
   * Update AI score configuration
   */
  @Patch('config')
  async updateConfig(
    @Request() req: any,
    @Body() body: {
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
    const organizationId = req.user.organizationId;
    return this.aiScoringService.updateScoreConfig(organizationId, body);
  }

  /**
   * Get all lead scores for the organization
   */
  @Get('scores')
  async getAllScores(
    @Request() req: any,
    @Query('tier') tier?: ScoreTier,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const organizationId = req.user.organizationId;
    return this.aiScoringService.getAllLeadScores(
      organizationId,
      tier,
      limit ? parseInt(limit) : 50,
      page ? parseInt(page) : 1,
    );
  }

  /**
   * Get AI score for a specific lead
   */
  @Get('scores/:leadId')
  async getLeadScore(
    @Request() req: any,
    @Param('leadId') leadId: string,
  ) {
    const organizationId = req.user.organizationId;
    return this.aiScoringService.getLeadScore(organizationId, leadId);
  }

  /**
   * Calculate/recalculate AI score for a specific lead
   */
  @Post('scores/:leadId/calculate')
  async calculateLeadScore(
    @Request() req: any,
    @Param('leadId') leadId: string,
  ) {
    const organizationId = req.user.organizationId;
    return this.aiScoringService.calculateLeadScore(organizationId, leadId);
  }

  /**
   * Recalculate AI scores for all leads in the organization
   */
  @Post('scores/recalculate-all')
  async recalculateAllScores(@Request() req: any) {
    const organizationId = req.user.organizationId;
    return this.aiScoringService.recalculateAllScores(organizationId);
  }

  /**
   * Get score distribution summary for dashboard
   */
  @Get('summary')
  async getScoreSummary(@Request() req: any) {
    const organizationId = req.user.organizationId;

    const [hotCount, warmCount, coldCount, lowCount, topLeads] = await Promise.all([
      this.prisma.leadAIScore.count({ where: { organizationId, tier: 'HOT' } }),
      this.prisma.leadAIScore.count({ where: { organizationId, tier: 'WARM' } }),
      this.prisma.leadAIScore.count({ where: { organizationId, tier: 'COLD' } }),
      this.prisma.leadAIScore.count({ where: { organizationId, tier: 'LOW' } }),
      this.prisma.leadAIScore.findMany({
        where: { organizationId },
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              status: { select: { name: true, color: true } },
            },
          },
        },
        orderBy: { totalScore: 'desc' },
        take: 5,
      }),
    ]);

    const config = await this.aiScoringService.getScoreConfig(organizationId);

    return {
      distribution: {
        hot: hotCount,
        warm: warmCount,
        cold: coldCount,
        low: lowCount,
        total: hotCount + warmCount + coldCount + lowCount,
      },
      topLeads: topLeads.map((l: any) => ({
        id: l.lead.id,
        name: `${l.lead.firstName || ''} ${l.lead.lastName || ''}`.trim(),
        phone: l.lead.phone,
        score: l.totalScore,
        tier: l.tier,
        status: l.lead.status,
      })),
      config: {
        hotThresholdMin: config.hotThresholdMin,
        warmThresholdMin: config.warmThresholdMin,
        coldThresholdMin: config.coldThresholdMin,
      },
    };
  }
}
