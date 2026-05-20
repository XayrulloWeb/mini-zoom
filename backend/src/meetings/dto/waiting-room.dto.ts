import { IsIn, IsString, MinLength } from 'class-validator';

export class WaitingRoomJoinDto {
  @IsString()
  @MinLength(1)
  roomName!: string;

  @IsString()
  @MinLength(1)
  participantName!: string;
}

export class WaitingRoomRespondDto {
  @IsString()
  @IsIn(['approved', 'rejected'])
  status!: 'approved' | 'rejected';
}
