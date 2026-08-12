import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type EntityType = 'LEAD' | 'CONTACT' | 'COMPANY' | 'DEAL';
export type FieldType  = 'TEXT' | 'NUMBER' | 'DROPDOWN' | 'DATE' | 'CHECKBOX' | 'URL' | 'PHONE' | 'TEXTAREA';

@Injectable()
export class CustomFieldsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, entityType?: EntityType) {
    return this.prisma.customFieldDefinition.findMany({
      where: {
        organizationId,
        ...(entityType && { entityType }),
      },
      orderBy: { order: 'asc' },
    });
  }

  async create(organizationId: string, dto: {
    entityType: EntityType;
    fieldName: string;
    fieldLabel: string;
    fieldType: FieldType;
    isRequired?: boolean;
    isVisible?: boolean;
    options?: string[];
    placeholder?: string;
  }) {
    // Check for duplicate field name in same org and entity
    const existing = await this.prisma.customFieldDefinition.findFirst({
      where: { organizationId, entityType: dto.entityType, fieldName: dto.fieldName },
    });
    if (existing) throw new BadRequestException(`Field '${dto.fieldName}' already exists for ${dto.entityType}`);

    const count = await this.prisma.customFieldDefinition.count({
      where: { organizationId, entityType: dto.entityType },
    });

    return this.prisma.customFieldDefinition.create({
      data: {
        organizationId,
        entityType:   dto.entityType,
        fieldName:    dto.fieldName,
        fieldLabel:   dto.fieldLabel,
        fieldType:    dto.fieldType,
        isRequired:   dto.isRequired ?? false,
        isVisible:    dto.isVisible ?? true,
        options:      dto.options ?? [],
        placeholder:  dto.placeholder,
        order:        count + 1,
      },
    });
  }

  async update(organizationId: string, id: string, dto: Partial<{
    fieldLabel: string; isRequired: boolean; isVisible: boolean; options: string[]; placeholder: string; order: number;
  }>) {
    const field = await this.prisma.customFieldDefinition.findFirst({ where: { id, organizationId } });
    if (!field) throw new NotFoundException('Custom field not found');

    return this.prisma.customFieldDefinition.update({
      where: { id },
      data: dto,
    });
  }

  async delete(organizationId: string, id: string) {
    const field = await this.prisma.customFieldDefinition.findFirst({ where: { id, organizationId } });
    if (!field) throw new NotFoundException('Custom field not found');

    await this.prisma.customFieldDefinition.delete({ where: { id } });
    return { success: true };
  }

  /** Validates a record's custom fields JSON object against definitions */
  async validateCustomFields(organizationId: string, entityType: EntityType, values: Record<string, any>) {
    const defs = await this.findAll(organizationId, entityType);

    for (const def of defs) {
      const val = values[def.fieldName];
      if (def.isRequired && (val === undefined || val === null || val === '')) {
        throw new BadRequestException(`Custom field '${def.fieldLabel}' is required.`);
      }
      if (val !== undefined && val !== null && def.fieldType === 'DROPDOWN' && def.options.length > 0) {
        if (!def.options.includes(val)) {
          throw new BadRequestException(`Invalid option '${val}' for field '${def.fieldLabel}'.`);
        }
      }
    }
    return true;
  }
}
