import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  getAll() {
    return this.prisma.user.findMany({ 
      include: { permissions: true },
      orderBy: { points: 'desc' }
    });
  }

  getLeaderboard() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        designation: true,
        email: true,
        points: true,
      },
      orderBy: { points: 'desc' },
    });
  }

  create(dto: CreateUserDto) {
    return this.prisma.user.create({ data: dto });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
