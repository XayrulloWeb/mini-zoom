import { IsBoolean, IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateMeetingDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  title?: string;

  @IsBoolean()
  @IsOptional()
  isPasswordProtected?: boolean;

  @IsString()
  @IsOptional()
  roomPassword?: string;

  @IsBoolean()
  @IsOptional()
  waitingRoomEnabled?: boolean;

  @IsDateString()
  @IsOptional()
  scheduledFor?: string;
}
