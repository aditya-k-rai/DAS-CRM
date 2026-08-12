export declare class CreateLeadDto {
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    statusId?: string;
    ownerId?: string;
    sourceId?: string;
    companyId?: string;
    customFields?: Record<string, any>;
    tags?: string[];
    notes?: string;
}
