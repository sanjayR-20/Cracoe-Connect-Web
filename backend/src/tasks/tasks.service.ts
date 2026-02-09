import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(assignedById: string, dto: CreateTaskDto) {
    const permissions = await this.prisma.permission.findUnique({
      where: { userId: assignedById },
    });
    if (!permissions?.canAssignTask) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        deadline: new Date(dto.deadline),
        priority: dto.priority,
        status: dto.status,
        assignedToId: dto.assignedToId,
        assignedById,
      },
    });
  }

  getByUser(userId: string) {
    return this.prisma.task.findMany({
      where: { assignedToId: userId },
      orderBy: { deadline: 'asc' },
    });
  }

  updateStatus(id: string, status: string) {
    return this.prisma.task.update({
      where: { id },
      data: { status },
    });
  }
}
