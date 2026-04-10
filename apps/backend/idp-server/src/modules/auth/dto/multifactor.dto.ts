import { MFAType } from '@csisp-api/idp-server';
import { Length, IsEnum, IsString } from 'class-validator';

export class MultifactorDto {
  @IsEnum(MFAType)
  type!: MFAType;

  @IsString()
  @Length(1, 64)
  codeOrAssertion!: string;
}
