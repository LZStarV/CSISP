import type { ClassId } from '@csisp/infra-database/public/Class';
import type HomeworkRow from '@csisp/infra-database/public/Homework';
import type {
  HomeworkId,
  HomeworkInitializer,
} from '@csisp/infra-database/public/Homework';
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
  tableName: 'homework',
  timestamps: true,
  underscored: true,
})
export class Homework
  extends Model<HomeworkRow, HomeworkInitializer>
  implements HomeworkRow
{
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: HomeworkId;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  class_id!: ClassId;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  title!: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  content!: string | null;

  @AllowNull(false)
  @Column(DataType.DATE)
  deadline!: Date;

  @Default(1)
  @Column(DataType.INTEGER)
  status!: number;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  created_at!: Date;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  updated_at!: Date;
}
