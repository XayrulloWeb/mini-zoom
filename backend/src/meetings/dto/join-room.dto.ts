import { IsOptional, IsString, MinLength } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @MinLength(1, { message: 'roomName is required' })
  roomName!: string;

  @IsString()
  @MinLength(1, { message: 'participantName is required' })
  participantName!: string;

  @IsString()
  @IsOptional()
  roomPassword?: string;
}
