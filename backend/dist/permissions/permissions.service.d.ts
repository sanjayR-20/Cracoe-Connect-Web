import { PrismaService } from '../prisma/prisma.service';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
export declare class PermissionsService {
    private prisma;
    constructor(prisma: PrismaService);
    update(userId: string, dto: UpdatePermissionsDto): import(".prisma/client").Prisma.Prisma__PermissionClient<{
        id: string;
        userId: string;
        canAssignTask: boolean;
        canAnnounce: boolean;
        canAddUser: boolean;
        canRemoveUser: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
