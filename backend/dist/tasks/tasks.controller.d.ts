import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    create(req: any, dto: CreateTaskDto): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        description: string;
        deadline: Date;
        priority: string;
        status: string;
        isUrgent: boolean;
        assignedToId: string;
        assignedById: string;
    }>;
    getByUser(userId: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        title: string;
        createdAt: Date;
        description: string;
        deadline: Date;
        priority: string;
        status: string;
        isUrgent: boolean;
        assignedToId: string;
        assignedById: string;
    }[]>;
    updateStatus(id: string, dto: UpdateStatusDto): import(".prisma/client").Prisma.Prisma__TaskClient<{
        id: string;
        title: string;
        createdAt: Date;
        description: string;
        deadline: Date;
        priority: string;
        status: string;
        isUrgent: boolean;
        assignedToId: string;
        assignedById: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
