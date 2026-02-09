import { IsDateString, IsString } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsDateString()
  deadline!: string;

  @IsString()
  priority!: string;

  @IsString()
  status!: string;

  @IsString()
  assignedToId!: string;
}
