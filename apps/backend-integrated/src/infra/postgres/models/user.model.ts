import { BelongsToMany, Column, DataType, Model, Table } from 'sequelize-typescript';
import { Role } from './role.model';
import { UserRole } from './user-role.model';

@Table({
  tableName: 'user',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class User extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({ type: DataType.STRING(50), allowNull: false, unique: true })
  username!: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  password!: string;

  @Column({ type: DataType.STRING(11), allowNull: false, unique: true, field: 'student_id' })
  studentId!: string;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'enrollment_year' })
  enrollmentYear!: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  major!: string;

  @Column({ type: DataType.STRING(50), allowNull: false, field: 'real_name' })
  realName!: string;

  @Column({ type: DataType.STRING(255), allowNull: true, unique: true })
  email!: string | null;

  @Column({ type: DataType.STRING(20), allowNull: true, unique: true })
  phone!: string | null;

  @Column({ type: DataType.INTEGER, defaultValue: 1 })
  status!: number;

  @BelongsToMany(() => Role, () => UserRole)
  roles?: Role[];
}
