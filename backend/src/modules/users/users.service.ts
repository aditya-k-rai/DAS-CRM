import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    if (!organizationId) return [];
    const users = await this.prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: { select: { name: true } },
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        organization: {
          select: {
            phone: true,
            adminEmail: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return users.map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
      role: u.role?.name || 'MEMBER',
      avatarUrl: u.avatarUrl,
      isActive: u.isActive,
      createdAt: u.createdAt,
      phone: (u.email === u.organization?.adminEmail ? u.organization?.phone : null) || u.organization?.phone || '',
    }));
  }

  async updatePhone(organizationId: string, userId: string, phone: string) {
    if (!organizationId) return null;
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { phone: cleanPhone },
    }).catch(() => null);

    return { success: true, phone: cleanPhone };
  }
}
