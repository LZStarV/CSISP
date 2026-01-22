// 课程相关类型定义
import type { Status, Semester, Timestamp, MajorList } from './base';

/**
 * 课程基础信息
 */
export interface CourseBase {
  courseName: string; // 课程名称
  courseCode: string; // 课程代码
  semester: Semester; // 学期
  academicYear: number; // 学年
  availableMajors: MajorList; // 可选择的专业列表
  status: Status; // 状态
}

/**
 * 课程完整信息
 */
export interface Course extends CourseBase {
  id: number; // 课程唯一标识符
  createdAt: Timestamp; // 创建时间
  updatedAt: Timestamp; // 更新时间
  teachers?: Teacher[];
  timeSlots?: TimeSlot[];
  classes?: Class[];
}

// 创建课程时的输入类型
export type CreateCourseInput = Omit<Course, 'id' | 'createdAt' | 'updatedAt'>;

// 更新课程时的输入类型
export type UpdateCourseInput = Partial<
  Omit<
    Course,
    | 'id'
    | 'courseCode'
    | 'semester'
    | 'academicYear'
    | 'createdAt'
    | 'updatedAt'
  >
>;

/**
 * 教师信息
 */
export interface Teacher {
  id: number; // 教师唯一标识符
  userId: number; // 关联用户ID（外键）
  teacherId: string; // 教师工号（唯一，11位字符串）
  realName: string; // 真实姓名
  email: string; // 邮箱（唯一）
  phone: string; // 手机号（唯一）
  department: string; // 所属部门
  title: string; // 职称
  status: Status; // 状态
  createdAt: Timestamp; // 创建时间
  updatedAt: Timestamp; // 更新时间
}

// 创建教师时的输入类型
export type CreateTeacherInput = Omit<
  Teacher,
  'id' | 'createdAt' | 'updatedAt'
>;

// 更新教师时的输入类型
export type UpdateTeacherInput = Partial<
  Omit<Teacher, 'id' | 'userId' | 'teacherId' | 'createdAt' | 'updatedAt'>
>;

/**
 * 课程教师关联
 */
export interface CourseTeacher {
  courseId: number;
  teacherId: number;
}

/**
 * 时间段模型（TimeSlot）
 */
export interface TimeSlot {
  id: number; // 时间段唯一标识符
  subCourseId: number; // 所属子课程ID（外键）
  weekday: number; // 星期几（1-7）
  startTime: string; // 开始时间
  endTime: string; // 结束时间
  location: string; // 上课地点
  status: Status; // 状态
  createdAt: Timestamp; // 创建时间
  updatedAt: Timestamp; // 更新时间
}

// 创建时间段时的输入类型
export type CreateTimeSlotInput = Omit<
  TimeSlot,
  'id' | 'createdAt' | 'updatedAt'
>;

// 更新时间段时的输入类型
export type UpdateTimeSlotInput = Partial<
  Omit<TimeSlot, 'id' | 'subCourseId' | 'createdAt' | 'updatedAt'>
>;

/**
 * 子课程模型（SubCourse）
 */
export interface SubCourse {
  id: number; // 子课程唯一标识符
  courseId: number; // 所属课程ID（外键）
  subCourseCode: string; // 子课程标识
  teacherId: number; // 授课教师ID（外键）
  academicYear: number; // 学年
  status: Status; // 状态
  createdAt: Timestamp; // 创建时间
  updatedAt: Timestamp; // 更新时间
}

// 创建子课程时的输入类型
export type CreateSubCourseInput = Omit<
  SubCourse,
  'id' | 'createdAt' | 'updatedAt'
>;

// 更新子课程时的输入类型
export type UpdateSubCourseInput = Partial<
  Omit<
    SubCourse,
    'id' | 'courseId' | 'subCourseCode' | 'createdAt' | 'updatedAt'
  >
>;

/**
 * 班级信息
 */
export interface Class {
  id: number; // 班级唯一标识符
  className: string; // 班级名称
  courseId: number; // 所属课程ID（外键）
  teacherId: number; // 授课教师ID（外键）
  semester: Semester; // 学期
  academicYear: number; // 学年
  maxStudents: number; // 最大学生数（默认50）
  status: Status; // 状态
  createdAt: Timestamp; // 创建时间
  updatedAt: Timestamp; // 更新时间
}

// 创建班级时的输入类型
export type CreateClassInput = Omit<Class, 'id' | 'createdAt' | 'updatedAt'>;

// 更新班级时的输入类型
export type UpdateClassInput = Partial<
  Omit<
    Class,
    | 'id'
    | 'courseId'
    | 'teacherId'
    | 'semester'
    | 'academicYear'
    | 'createdAt'
    | 'updatedAt'
  >
>;

/**
 * 用户班级关联
 */
export interface UserClass {
  id: number; // 关联唯一标识符
  userId: number; // 用户ID（外键，级联删除）
  classId: number; // 班级ID（外键，级联删除）
  joinTime: Timestamp; // 加入时间
  status: Status; // 状态
}

// 创建关联时的输入类型
export type CreateUserClassInput = Omit<UserClass, 'id' | 'joinTime'>;

// 更新关联时的输入类型
export type UpdateUserClassInput = Partial<
  Omit<UserClass, 'id' | 'userId' | 'classId' | 'joinTime'>
>;

/**
 * 学期配置
 */
export interface SemesterConfig {
  id: number;
  year: string;
  semester: 1 | 2;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  status: Status;
}
