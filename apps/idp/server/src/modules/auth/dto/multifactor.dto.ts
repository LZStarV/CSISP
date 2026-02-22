import { MFAType } from '@csisp/idl/idp';
import { Length, IsEnum, IsOptional, IsString } from 'class-validator';

export class MultifactorDto {
  @IsEnum(MFAType)
  type!: MFAType;

  @IsString()
  @Length(1, 64)
  codeOrAssertion!: string;

  @IsOptional()
  @IsString()
  @Length(0, 128)
  phoneOrEmail?: string;
}
