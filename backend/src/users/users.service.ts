import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

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

  async getProfile(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { permissions: true },
    });
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        profileImage: dto.profilePhoto,
        phone: dto.phone,
        location: dto.location,
        shortBio: dto.shortBio,
        education: dto.education,
        github: dto.github,
        linkedin: dto.linkedin,
        skills: dto.skills,
        interests: dto.interests,
        experience: dto.experience,
      },
      include: { permissions: true },
    });
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    // For now, we'll do simple string comparison.
    if (user.password !== dto.currentPassword) {
      throw new Error('Current password is incorrect');
    }

    return this.prisma.user.update({
      where: { id },
      data: { password: dto.newPassword },
    });
  }

  create(dto: CreateUserDto) {
    return this.prisma.user.create({ data: dto });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
