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

export class UpdateSellerProfileDto {
  name?: string;
  logoUrl?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  panNumber?: string;
  bankDetails?: {
    bankName?: string;
    accountNo?: string;
    ifscCode?: string;
    branch?: string;
    upiId?: string;
  };
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

  // ─── Seller Profile (Quotation) ─────────────────────────────────────
  // Open to ALL roles in the organization — allows sales/managers to set seller details for quotations

  async getSellerProfile(orgId: string) {
    let org: any = null;
    if (orgId && orgId !== 'org_default' && orgId !== 'platform_system') {
      org = await this.prisma.organization.findUnique({
        where: { id: orgId },
      }).catch(() => null);
    }

    if (!org) {
      org = await this.prisma.organization.findFirst({
        where: { id: { not: 'comp_das' } },
        orderBy: { createdAt: 'desc' },
      }).catch(() => null);
    }

    if (!org) {
      org = await this.prisma.organization.findFirst().catch(() => null);
    }

    if (!org) {
      return {
        id: 'seller-org',
        name: 'Adorable Trading',
        logoUrl: '',
        phone: '',
        address: 'Registered Business Address',
        gstNumber: '',
        panNumber: '',
        bankDetails: {
          bankName: 'HDFC Bank',
          accountNo: '50200012345678',
          ifscCode: 'HDFC0001234',
          branch: 'Corporate Hub',
          upiId: 'adorable@hdfc',
        },
      };
    }

    const settings = (org.settings as any) || {};
    const bankDetails = settings.bankDetails || {};

    return {
      id: org.id,
      name: org.name || 'Adorable Trading',
      logoUrl: org.logoUrl || settings.logoUrl || '',
      phone: org.phone || '',
      address: settings.address || (org.city ? `${org.city}${org.state ? ', ' + org.state : ''}, India` : 'Registered Business Address'),
      gstNumber: org.gstNumber || settings.gstNumber || '',
      panNumber: org.panNumber || settings.panNumber || '',
      bankDetails: {
        bankName: bankDetails.bankName || 'HDFC Bank',
        accountNo: bankDetails.accountNo || '',
        ifscCode: bankDetails.ifscCode || '',
        branch: bankDetails.branch || '',
        upiId: bankDetails.upiId || '',
      },
    };
  }

  async updateSellerProfile(orgId: string, dto: UpdateSellerProfileDto) {
    let org: any = null;
    if (orgId && orgId !== 'org_default' && orgId !== 'platform_system') {
      org = await this.prisma.organization.findUnique({
        where: { id: orgId },
      }).catch(() => null);
    }

    if (!org) {
      org = await this.prisma.organization.findFirst({
        where: { id: { not: 'comp_das' } },
        orderBy: { createdAt: 'desc' },
      }).catch(() => null);
    }

    if (!org) {
      org = await this.prisma.organization.findFirst().catch(() => null);
    }

    if (!org) {
      return {
        id: 'seller-org',
        name: dto.name || 'Adorable Trading',
        logoUrl: dto.logoUrl || '',
        phone: dto.phone || '',
        address: dto.address || 'Registered Business Address',
        gstNumber: dto.gstNumber || '',
        panNumber: dto.panNumber || '',
        bankDetails: {
          bankName: dto.bankDetails?.bankName || 'HDFC Bank',
          accountNo: dto.bankDetails?.accountNo || '',
          ifscCode: dto.bankDetails?.ifscCode || '',
          branch: dto.bankDetails?.branch || '',
          upiId: dto.bankDetails?.upiId || '',
        },
      };
    }

    const currentSettings = (org.settings as any) || {};
    const currentBankDetails = currentSettings.bankDetails || {};

    const updatedSettings = {
      ...currentSettings,
      ...(dto.address !== undefined ? { address: dto.address } : {}),
      ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
      ...(dto.gstNumber !== undefined ? { gstNumber: dto.gstNumber } : {}),
      ...(dto.panNumber !== undefined ? { panNumber: dto.panNumber } : {}),
      bankDetails: dto.bankDetails
        ? { ...currentBankDetails, ...dto.bankDetails }
        : currentBankDetails,
    };

    const updated = await this.prisma.organization.update({
      where: { id: org.id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
        ...(dto.gstNumber !== undefined ? { gstNumber: dto.gstNumber } : {}),
        ...(dto.panNumber !== undefined ? { panNumber: dto.panNumber } : {}),
        settings: updatedSettings,
      },
    }).catch(() => org);

    const settings = (updated.settings as any) || {};
    const bankDetails = settings.bankDetails || {};

    return {
      id: updated.id,
      name: updated.name || '',
      logoUrl: updated.logoUrl || settings.logoUrl || '',
      phone: updated.phone || '',
      address: settings.address || '',
      gstNumber: updated.gstNumber || settings.gstNumber || '',
      panNumber: updated.panNumber || settings.panNumber || '',
      bankDetails: {
        bankName: bankDetails.bankName || '',
        accountNo: bankDetails.accountNo || '',
        ifscCode: bankDetails.ifscCode || '',
        branch: bankDetails.branch || '',
        upiId: bankDetails.upiId || '',
      },
    };
  }
}
