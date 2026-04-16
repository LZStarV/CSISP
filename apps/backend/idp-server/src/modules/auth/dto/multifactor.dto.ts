import { MFAType, AuthMultifactorRequest } from '@csisp-api/idp-server';
import { Length, IsEnum, IsString } from 'class-validator';

export class MultifactorDto implements AuthMultifactorRequest {
  @IsEnum(MFAType)
  type!: MFAType;

  @IsString()
  @Length(1, 64)
  codeOrAssertion!: string;
}
