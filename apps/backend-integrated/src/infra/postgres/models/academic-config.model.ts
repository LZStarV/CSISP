import type AcademicConfigRow from '@csisp/infra-database/public/AcademicConfig';
import type {
  AcademicConfigId,
  AcademicConfigInitializer,
} from '@csisp/infra-database/public/AcademicConfig';
import {
  Column,
  DataType,
  Model,
  Table,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Default,
} from 'sequelize-typescript';

@Table({
  tableName: 'academic_config',
  timestamps: false,
  underscored: true,
})
export class AcademicConfigModel
  extends Model<AcademicConfigRow, AcademicConfigInitializer>
  implements AcademicConfigRow
{
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: AcademicConfigId;

  @AllowNull(false)
  @Column(DataType.STRING(10))
  year!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  semester!: number;

  @AllowNull(false)
  @Column(DataType.DATE)
  start_date!: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  end_date!: Date;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  is_current!: boolean;

  @Default(1)
  @Column(DataType.INTEGER)
  status!: number;
}
