import { PermissionsService } from './permissions.service';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
export declare class PermissionsController {
    private readonly permissionsService;
    constructor(permissionsService: PermissionsService);
    update(userId: string, dto: UpdatePermissionsDto): import(".prisma/client").Prisma.Prisma__PermissionClient<{
        id: string;
        userId: string;
        canAssignTask: boolean;
        canAnnounce: boolean;
        canAddUser: boolean;
        canRemoveUser: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
