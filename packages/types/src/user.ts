// 用户相关类型定义
import type { Status, Timestamp, UserRoleType } from './base';

/**
 * 用户基础信息
 */
export interface UserBase {
  username: string; // 用户名（唯一）
  password: string; // 密码（加密存储）
  studentId: string; // 学号（唯一，11位字符串）
  enrollmentYear: number; // 入学年份（范围：2000-3000）
  major: string; // 专业名称
  realName: string; // 真实姓名
  status: Status; // 状态
}

/**
 * 用户完整信息
 */
export interface User extends UserBase {
  id: number; // 用户唯一标识符
  createdAt: Timestamp; // 创建时间
  updatedAt: Timestamp; // 更新时间
}

// 创建用户时的输入类型（不含自动生成的字段）
export type CreateUserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

// 更新用户时的输入类型（不含自动生成的字段和不可更新字段）
export type UpdateUserInput = Partial<
  Omit<
    User,
    | 'id'
    | 'username'
    | 'studentId'
    | 'enrollmentYear'
    | 'createdAt'
    | 'updatedAt'
  >
>;

/**
 * 用户登录参数
 */
export interface LoginParams {
  username: string;
  password: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  token: string;
  user: User;
  roles: UserRoleType[];
}

/**
 * 用户角色信息
 */
export interface Role {
  id: number; // 角色唯一标识符
  name: string; // 角色名称
  code: string; // 角色代码
  description: string; // 角色描述
  status: Status; // 状态
  createdAt: Timestamp; // 创建时间
  updatedAt: Timestamp; // 更新时间
}

/**
 * 用户角色关联
 */
export interface UserRole {
  userId: number;
  roleId: number;
}

/**
 * 课代表信息
 */
export interface CourseRep {
  id: number; // 课代表唯一标识符
  userId: number; // 学生用户ID（外键）
  classId: number; // 所属班级ID（外键）
  responsibility: string; // 职责描述
  appointmentDate: Timestamp; // 任命日期
  status: Status; // 状态
  createdAt: Timestamp; // 创建时间
  updatedAt: Timestamp; // 更新时间
}

// 创建课代表时的输入类型
export type CreateCourseRepInput = Omit<
  CourseRep,
  'id' | 'appointmentDate' | 'createdAt' | 'updatedAt'
>;

// 更新课代表时的输入类型
export type UpdateCourseRepInput = Partial<
  Omit<
    CourseRep,
    'id' | 'userId' | 'classId' | 'appointmentDate' | 'createdAt' | 'updatedAt'
  >
>;

/**
 * 权限信息
 */
export interface Permission {
  id: number; // 权限唯一标识符
  name: string; // 权限名称
  code: string; // 权限代码
  description: string; // 权限描述
  status: Status; // 状态
  createdAt: Timestamp; // 创建时间
  updatedAt: Timestamp; // 更新时间
}

// 创建权限时的输入类型
export type CreatePermissionInput = Omit<
  Permission,
  'id' | 'createdAt' | 'updatedAt'
>;

// 更新权限时的输入类型
export type UpdatePermissionInput = Partial<
  Omit<Permission, 'id' | 'code' | 'createdAt' | 'updatedAt'>
>;

/**
 * 角色权限关联
 */
export interface RolePermission {
  roleId: number;
  permissionId: number;
}
