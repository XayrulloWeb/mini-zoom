import { IsString } from 'class-validator';

export class RefreshDto {
  @IsString({ message: 'refreshToken is required' })
  refreshToken!: string;
}
