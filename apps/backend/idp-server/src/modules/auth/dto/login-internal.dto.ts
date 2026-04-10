import { LoginInternalDto as GeneratedLoginInternalDto } from '@csisp-api/idp-server';
import { IsEmail, IsString, Length } from 'class-validator';

export class LoginInternalDto implements GeneratedLoginInternalDto {
  @IsEmail()
  @Length(5, 256)
  email!: string;

  @IsString()
  @Length(1, 512)
  password!: string;
}
