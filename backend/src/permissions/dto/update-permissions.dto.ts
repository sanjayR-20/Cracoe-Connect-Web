import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePermissionsDto {
  @IsOptional()
  @IsBoolean()
  canAssignTask?: boolean;

  @IsOptional()
  @IsBoolean()
  canAnnounce?: boolean;

  @IsOptional()
  @IsBoolean()
  canAddUser?: boolean;

  @IsOptional()
  @IsBoolean()
  canRemoveUser?: boolean;
}
