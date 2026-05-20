import { IsString, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @MinLength(1, { message: 'receiverId is required' })
  receiverId!: string;

  @IsString()
  @MinLength(1, { message: 'text is required' })
  text!: string;
}
