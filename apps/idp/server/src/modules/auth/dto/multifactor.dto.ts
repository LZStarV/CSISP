import { Length, IsEnum, IsString } from 'class-validator';

import { MFAType } from '../enums';

export class MultifactorDto {
  @IsEnum(MFAType)
  type!: MFAType;

  @IsString()
  @Length(1, 64)
  codeOrAssertion!: string;
}
