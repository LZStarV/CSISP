import { SetMetadata } from '@nestjs/common';
export const ROLES_KEY = 'roles';

/**
 * 角色声明装饰器
 * 在控制器/方法上声明需要的角色信息，
 * 由 RolesGuard 在运行时读取并进行权限校验。
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
