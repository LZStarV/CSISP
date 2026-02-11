import type Role from '@pgtype/Role';
import type User from '@pgtype/User';

/**
 * 基础角色定义
 */
export const BASE_ROLES: Array<Partial<Role>> = [
  { name: 'admin', code: 'admin', description: '管理员' },
  { name: 'student', code: 'student', description: '学生' },
  { name: 'teacher', code: 'teacher', description: '教师' },
];

/**
 * 管理员账号定义
 */
export const ADMIN_USER_SEED: Partial<User> = {
  username: 'LZStarV',
  real_name: '管理员',
  student_id: '20232131082',
  enrollment_year: 2023,
  major: '计算机科学与技术',
  email: '3654498270@qq.com',
  phone: '13702501230',
  password:
    'scrypt$eNY9JfueXuvppVAP3RKgTg==$554SPCMIbGIGxWcvrjWUXdWdyBYHsiFGighDP3rkYVY=',
};
