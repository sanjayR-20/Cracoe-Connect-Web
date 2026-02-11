import { AuthService } from './auth.service';
import { VerifyTokenDto } from './dto/verify-token.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    verifyToken(dto: VerifyTokenDto): Promise<{
        token: string;
        user: {
            id: string;
            name: string;
            createdAt: Date;
            email: string;
            designation: string;
            role: import(".prisma/client").$Enums.Role;
            profileImage: string | null;
            isActive: boolean;
        };
    }>;
}
