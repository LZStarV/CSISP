export type BaseRoleSeed = {
  name: string;
  code: string;
  description: string;
};

export const BASE_ROLES: BaseRoleSeed[] = [
  { name: 'admin', code: 'admin', description: '管理员' },
  { name: 'student', code: 'student', description: '学生' },
  { name: 'teacher', code: 'teacher', description: '教师' },
];

export type AdminUserSeed = {
  username: string;
  realName: string;
  studentId: string;
  enrollmentYear: number;
  major: string;
  email: string;
  phone: string;
};

export const ADMIN_USER_SEED: AdminUserSeed = {
  username: 'admin',
  realName: '系统管理员',
  studentId: '20232131082',
  enrollmentYear: 2023,
  major: '计算机科学与技术',
  email: 'admin@csisp.edu',
  phone: '13800000000',
};
