import { IsArray, IsString, MinLength } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @MinLength(1, { message: 'Group name is required' })
  name!: string;

  @IsArray()
  @IsString({ each: true })
  memberIds!: string[];
}

export class SendGroupMessageDto {
  @IsString()
  @MinLength(1)
  text!: string;
}

export class AddGroupMemberDto {
  @IsString()
  @MinLength(1)
  userId!: string;
}
