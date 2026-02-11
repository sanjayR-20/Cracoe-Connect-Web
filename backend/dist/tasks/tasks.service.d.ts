import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
export declare class TasksService {
    private prisma;
    constructor(prisma: PrismaService);
    create(assignedById: string, dto: CreateTaskDto): Promise<{
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
    updateStatus(id: string, status: string): import(".prisma/client").Prisma.Prisma__TaskClient<{
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
