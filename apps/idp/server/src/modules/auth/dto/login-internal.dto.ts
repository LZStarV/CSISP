import { IsEmail, IsString, Length } from 'class-validator';

export class LoginInternalDto {
  @IsEmail()
  @Length(5, 256)
  email!: string;

  @IsString()
  @Length(1, 512)
  password!: string;
}
