import { AuthService } from '../auth.service';
declare const LocalStrategy_base: new (...args: any) => any;
export declare class LocalStrategy extends LocalStrategy_base {
    private authService;
    constructor(authService: AuthService);
    validate(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
        organization: {
            id: string;
            slug: string;
            name: string;
            logoUrl: string | null;
            website: string | null;
            industry: string | null;
            templateId: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
}
export {};
