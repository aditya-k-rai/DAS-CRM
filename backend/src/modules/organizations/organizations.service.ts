import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export class UpdateOrganizationDto {
  name?: string;
  phone?: string;
  city?: string;
  state?: string;
  companyType?: string;
  sector?: string;
  settings?: any;
}

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyOrganization(orgId: string, userRole: string) {
    const roleUpper = (userRole || '').toUpperCase();
    if (roleUpper !== 'ADMIN' && roleUpper !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Access Restricted: Company Profile Settings are restricted to Admin dashboard only.',
      );
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        subscription: true,
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found.');
    }

    const keyRecord = await this.prisma.companyRegistrationKey.findFirst({
      where: { usedByOrganizationId: orgId },
    });

    return {
      ...org,
      companyKey: keyRecord?.key || org.registrationKeyId || 'N/A',
      keyRecord,
    };
  }

  async updateMyOrganization(orgId: string, userRole: string, dto: UpdateOrganizationDto) {
    const roleUpper = (userRole || '').toUpperCase();
    if (roleUpper !== 'ADMIN' && roleUpper !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Access Restricted: Only Administrators can edit Company Profile Settings.',
      );
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException('Organization not found.');
    }

    const currentSettings = (org.settings as any) || {};
    const updatedSettings = dto.settings ? { ...currentSettings, ...dto.settings } : currentSettings;

    return this.prisma.organization.update({
      where: { id: orgId },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.city !== undefined ? { city: dto.city } : {}),
        ...(dto.state !== undefined ? { state: dto.state } : {}),
        ...(dto.companyType !== undefined ? { companyType: dto.companyType } : {}),
        ...(dto.sector !== undefined ? { sector: dto.sector } : {}),
        settings: updatedSettings,
      },
      include: {
        subscription: true,
      },
    });
  }
}
