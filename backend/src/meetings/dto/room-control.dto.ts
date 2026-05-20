import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class MuteParticipantDto {
  @IsString()
  @MinLength(1)
  participantIdentity!: string;

  @IsString()
  @MinLength(1)
  trackSid!: string;

  @IsBoolean()
  muted!: boolean;
}

export class KickParticipantDto {
  @IsString()
  @MinLength(1)
  participantIdentity!: string;
}
