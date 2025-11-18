import type { Teacher } from './course';

// 课程数据类型定义
export interface CourseDataItem {
  course_name: string;
  course_code: string;
  semester: number;
  available_majors: string[];
}

// 教师数据类型定义（扩展自Teacher接口）
export interface TeacherDataItem extends Omit<Teacher, 'id' | 'status'> {
  realName: string;
  department: string;
}

// 用户创建属性
export interface UserCreationAttributes {
  username: string;
  password: string;
  realName: string;
  studentId: string;
  enrollmentYear: number;
  major: string;
  status?: number;
  email?: string;
  phone?: string;
}

// 角色创建属性
export interface RoleCreationAttributes {
  name: string;
  description: string;
  status?: number;
}

// 课程教师关联属性
export interface CourseTeacherAttributes {
  courseId: number;
  teacherId: number;
}

// 用户角色关联属性
export interface UserRoleAttributes {
  userId: number;
  roleId: number;
}

// 用户班级关联属性
export interface UserClassAttributes {
  userId: number;
  classId: number;
}
