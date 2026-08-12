import { PrismaService } from '../../prisma/prisma.service';
export type EntityType = 'LEAD' | 'CONTACT' | 'COMPANY' | 'DEAL' | 'lead' | 'contact' | 'company' | 'deal';
export type FieldType = 'TEXT' | 'NUMBER' | 'DROPDOWN' | 'MULTI_SELECT' | 'DATE' | 'CHECKBOX' | 'URL' | 'EMAIL' | 'PHONE' | 'TEXTAREA';
export declare class CustomFieldsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(organizationId: string, entityType?: string): Promise<{
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
        entityType: string;
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
        label: string;
        fieldLabel: string;
        isRequired: boolean;
        options: string[];
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
    validateCustomFields(organizationId: string, entityType: string, values: Record<string, any>): Promise<boolean>;
}
