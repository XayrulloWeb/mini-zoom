import { IsBoolean, IsDateString, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class CreateMeetingDto {
  @IsString()
  @MinLength(1, { message: 'title is required' })
  title!: string;

  @IsString()
  @IsOptional()
  roomName?: string;

  @IsBoolean()
  @IsOptional()
  isPasswordProtected?: boolean;

  @ValidateIf((o) => o.isPasswordProtected === true)
  @IsString()
  @MinLength(1, { message: 'roomPassword is required when isPasswordProtected=true' })
  roomPassword?: string;

  @IsBoolean()
  @IsOptional()
  waitingRoomEnabled?: boolean;

  @IsDateString({}, { message: 'scheduledFor must be a valid ISO date' })
  @IsOptional()
  scheduledFor?: string;
}
