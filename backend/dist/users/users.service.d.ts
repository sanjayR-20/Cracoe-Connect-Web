import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    getAll(): import(".prisma/client").Prisma.PrismaPromise<({
        permissions: {
            id: string;
            userId: string;
            canAssignTask: boolean;
            canAnnounce: boolean;
            canAddUser: boolean;
            canRemoveUser: boolean;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        email: string;
        designation: string;
        role: import(".prisma/client").$Enums.Role;
        profileImage: string | null;
        isActive: boolean;
    })[]>;
    create(dto: CreateUserDto): import(".prisma/client").Prisma.Prisma__UserClient<{
        id: string;
        name: string;
        createdAt: Date;
        email: string;
        designation: string;
        role: import(".prisma/client").$Enums.Role;
        profileImage: string | null;
        isActive: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__UserClient<{
        id: string;
        name: string;
        createdAt: Date;
        email: string;
        designation: string;
        role: import(".prisma/client").$Enums.Role;
        profileImage: string | null;
        isActive: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
