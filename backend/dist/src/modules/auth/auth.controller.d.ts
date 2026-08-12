import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
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
    login(dto: LoginDto): Promise<{
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
    refresh(token: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(user: any, token: string): Promise<void>;
    me(user: any): any;
}
