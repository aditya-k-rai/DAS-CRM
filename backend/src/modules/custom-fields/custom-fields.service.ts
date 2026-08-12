import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomFieldType } from '@prisma/client';

export type EntityType =
  | 'LEAD'
  | 'CONTACT'
  | 'COMPANY'
  | 'DEAL'
  | 'lead'
  | 'contact'
  | 'company'
  | 'deal';
export type FieldType =
  | 'TEXT'
  | 'NUMBER'
  | 'DROPDOWN'
  | 'MULTI_SELECT'
  | 'DATE'
  | 'CHECKBOX'
  | 'URL'
  | 'EMAIL'
  | 'PHONE'
  | 'TEXTAREA';

@Injectable()
export class CustomFieldsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, entityType?: string) {
    const entity = entityType ? entityType.toLowerCase() : undefined;
    return this.prisma.customFieldDefinition.findMany({
      where: {
        organizationId,
        ...(entity && { entity }),
      },
      orderBy: { order: 'asc' },
    });
  }

  async create(
    organizationId: string,
    dto: {
      entityType: string;
      fieldName: string;
      fieldLabel: string;
      fieldType: FieldType;
      isRequired?: boolean;
      isVisible?: boolean;
      options?: string[];
      placeholder?: string;
    },
  ) {
    const entity = dto.entityType.toLowerCase();
    const key = dto.fieldName;
    const label = dto.fieldLabel;
    const fieldTypeEnum = dto.fieldType === 'TEXTAREA' ? 'TEXT' : dto.fieldType;

    // Check for duplicate field name in same org and entity
    const existing = await this.prisma.customFieldDefinition.findFirst({
      where: { organizationId, entity, key },
    });
    if (existing)
      throw new BadRequestException(
        `Field '${key}' already exists for ${entity}`,
      );

    const count = await this.prisma.customFieldDefinition.count({
      where: { organizationId, entity },
    });

    return this.prisma.customFieldDefinition.create({
      data: {
        organizationId,
        entity,
        key,
        label,
        fieldType: fieldTypeEnum,
        isRequired: dto.isRequired ?? false,
        options: dto.options ?? [],
        order: count + 1,
      },
    });
  }

  async update(
    organizationId: string,
    id: string,
    dto: Partial<{
      label: string;
      fieldLabel: string;
      isRequired: boolean;
      options: string[];
      order: number;
    }>,
  ) {
    const field = await this.prisma.customFieldDefinition.findFirst({
      where: { id, organizationId },
    });
    if (!field) throw new NotFoundException('Custom field not found');

    return this.prisma.customFieldDefinition.update({
      where: { id },
      data: {
        ...(dto.label || dto.fieldLabel
          ? { label: dto.label ?? dto.fieldLabel }
          : {}),
        ...(dto.isRequired !== undefined ? { isRequired: dto.isRequired } : {}),
        ...(dto.options ? { options: dto.options } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
      },
    });
  }

  async delete(organizationId: string, id: string) {
    const field = await this.prisma.customFieldDefinition.findFirst({
      where: { id, organizationId },
    });
    if (!field) throw new NotFoundException('Custom field not found');

    await this.prisma.customFieldDefinition.delete({ where: { id } });
    return { success: true };
  }

  /** Validates a record's custom fields JSON object against definitions */
  async validateCustomFields(
    organizationId: string,
    entityType: string,
    values: Record<string, any>,
  ) {
    const defs = await this.findAll(organizationId, entityType);

    for (const def of defs) {
      const val = values[def.key];
      if (def.isRequired && (val === undefined || val === null || val === '')) {
        throw new BadRequestException(
          `Custom field '${def.label}' is required.`,
        );
      }
      const opts = Array.isArray(def.options) ? (def.options as string[]) : [];
      if (
        val !== undefined &&
        val !== null &&
        def.fieldType === 'DROPDOWN' &&
        opts.length > 0
      ) {
        if (!opts.includes(val)) {
          throw new BadRequestException(
            `Invalid option '${val}' for field '${def.label}'.`,
          );
        }
      }
    }
    return true;
  }
}
