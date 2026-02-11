import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  async create(createdBy: string, dto: CreateAnnouncementDto) {
    const permissions = await this.prisma.permission.findUnique({
      where: { userId: createdBy },
    });
    if (!permissions?.canAnnounce) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.prisma.announcement.create({
      data: {
        title: dto.title,
        message: dto.message,
        createdBy,
      },
    });
  }

  getAll() {
    return this.prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
