import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';

const TASK_COMPLETION_AUTHORITIES = [
  'shri dharshini',
  'siva dharana',
  'sharvesh'
];

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

  async updateStatus(id: string, status: string, updatedById: string) {
    const updater = await this.prisma.user.findUnique({
      where: { id: updatedById },
    });

    if (!updater) {
      throw new ForbiddenException('User not found');
    }

    const normalizedName = updater.name.toLowerCase().trim();
    const hasAuthority = TASK_COMPLETION_AUTHORITIES.some(
      auth => auth.toLowerCase() === normalizedName
    );

    if (!hasAuthority) {
      throw new ForbiddenException('Only authorized personnel can update task status');
    }

    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { assignedTo: true },
    });

    if (!task) {
      throw new ForbiddenException('Task not found');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: { status },
    });

    if (status === 'Completed' && task.status !== 'Completed') {
      await this.prisma.user.update({
        where: { id: task.assignedToId },
        data: { points: { increment: 10 } },
      });
    }

    return updatedTask;
  }
}
