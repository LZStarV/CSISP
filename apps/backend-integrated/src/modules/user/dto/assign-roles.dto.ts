import { IsArray, ArrayMaxSize, IsNumber } from 'class-validator';

export class AssignRolesDto {
  @IsArray()
  @ArrayMaxSize(10)
  @IsNumber({}, { each: true })
  roleIds!: number[];
}
