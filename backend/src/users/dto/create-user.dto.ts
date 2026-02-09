import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  designation!: string;

  @IsEnum(Role)
  role!: Role;

  @IsOptional()
  @IsString()
  profileImage?: string;
}
