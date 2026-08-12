import { PrismaService } from '../../prisma/prisma.service';
export type EntityType = 'LEAD' | 'CONTACT' | 'COMPANY' | 'DEAL';
export type FieldType = 'TEXT' | 'NUMBER' | 'DROPDOWN' | 'DATE' | 'CHECKBOX' | 'URL' | 'PHONE' | 'TEXTAREA';
export declare class CustomFieldsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(organizationId: string, entityType?: EntityType): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        isSystem: boolean;
        order: number;
        entity: string;
        key: string;
        label: string;
        fieldType: import("@prisma/client").$Enums.CustomFieldType;
        options: import("@prisma/client/runtime/library").JsonValue | null;
        isRequired: boolean;
    }[]>;
    create(organizationId: string, dto: {
        entityType: EntityType;
        fieldName: string;
        fieldLabel: string;
        fieldType: FieldType;
        isRequired?: boolean;
        isVisible?: boolean;
        options?: string[];
        placeholder?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        isSystem: boolean;
        order: number;
        entity: string;
        key: string;
        label: string;
        fieldType: import("@prisma/client").$Enums.CustomFieldType;
        options: import("@prisma/client/runtime/library").JsonValue | null;
        isRequired: boolean;
    }>;
    update(organizationId: string, id: string, dto: Partial<{
        fieldLabel: string;
        isRequired: boolean;
        isVisible: boolean;
        options: string[];
        placeholder: string;
        order: number;
    }>): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        isSystem: boolean;
        order: number;
        entity: string;
        key: string;
        label: string;
        fieldType: import("@prisma/client").$Enums.CustomFieldType;
        options: import("@prisma/client/runtime/library").JsonValue | null;
        isRequired: boolean;
    }>;
    delete(organizationId: string, id: string): Promise<{
        success: boolean;
    }>;
    validateCustomFields(organizationId: string, entityType: EntityType, values: Record<string, any>): Promise<boolean>;
}
