import { IsString, MinLength, IsIn } from 'class-validator';

export class AddFriendDto {
  @IsString()
  @MinLength(1, { message: 'friendId is required' })
  friendId!: string;
}

export class RespondFriendDto {
  @IsString()
  @IsIn(['accept', 'reject'], { message: 'action must be accept or reject' })
  action!: 'accept' | 'reject';
}
