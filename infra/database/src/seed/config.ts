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
  password: string;
};

export const ADMIN_USER_SEED: AdminUserSeed = {
  username: 'LZStarV',
  realName: '管理员',
  studentId: '20232131082',
  enrollmentYear: 2023,
  major: '计算机科学与技术',
  email: '3654498270@qq.com',
  phone: '13702501230',
  password:
    'scrypt$eNY9JfueXuvppVAP3RKgTg==$554SPCMIbGIGxWcvrjWUXdWdyBYHsiFGighDP3rkYVY=',
};
