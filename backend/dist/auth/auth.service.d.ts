import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    constructor(prisma: PrismaService);
    verifyAndIssue(idToken: string): Promise<{
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
