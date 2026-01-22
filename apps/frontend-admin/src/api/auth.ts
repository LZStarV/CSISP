import type {
  LoginParams,
  LoginResponse,
  User,
  Role,
  Permission,
  PaginationResponse,
  ApiResponse,
} from '@csisp/types';

import { request } from './request';

export const authApi = {
  // 用户登录
  login: (params: LoginParams): Promise<ApiResponse<LoginResponse>> => {
    return request.post('/users/login', params);
  },

  // 用户登出
  logout: (): Promise<ApiResponse<void>> => {
    // 后端暂无登出接口，这里直接返回成功
    return Promise.resolve({ code: 200, message: 'OK' } as any);
  },

  // 获取用户信息
  getUserInfo: (): Promise<ApiResponse<{ user: User; roles?: Role[] }>> => {
    return request.get('/users/me');
  },

  // 刷新token
  refreshToken: (): Promise<ApiResponse<{ token: string }>> => {
    return request.post('/auth/refresh');
  },
};

export const userApi = {
  // 获取用户列表
  getUsers: (params?: any): Promise<ApiResponse<PaginationResponse<User>>> => {
    return request.get('/users', { params });
  },

  // 获取单个用户
  getUser: (id: number): Promise<ApiResponse<User>> => {
    return request.get(`/users/${id}`);
  },

  // 创建用户
  createUser: (data: Partial<User>): Promise<ApiResponse<User>> => {
    return request.post('/users', data);
  },

  // 更新用户
  updateUser: (id: number, data: Partial<User>): Promise<ApiResponse<User>> => {
    return request.put(`/users/${id}`, data);
  },

  // 删除用户
  deleteUser: (id: number): Promise<ApiResponse<void>> => {
    return request.delete(`/users/${id}`);
  },

  // 获取用户权限
  getUserPermissions: (userId: number): Promise<ApiResponse<Permission[]>> => {
    // 后端暂未提供权限接口，返回空数组
    return Promise.resolve({ code: 200, message: 'OK', data: [] } as any);
  },

  // 获取用户角色
  getUserRoles: (userId: number): Promise<ApiResponse<Role[]>> => {
    return request.get(`/users/${userId}/roles`);
  },

  // 角色管理
  getRoles: (): Promise<ApiResponse<Role[]>> => {
    // 后端暂无角色列表路由，返回空列表
    return Promise.resolve({ code: 200, message: 'OK', data: [] } as any);
  },

  getRole: (id: number): Promise<ApiResponse<Role>> => {
    return request.get(`/roles/${id}`);
  },

  createRole: (data: Partial<Role>): Promise<ApiResponse<Role>> => {
    return request.post('/roles', data);
  },

  updateRole: (id: number, data: Partial<Role>): Promise<ApiResponse<Role>> => {
    return request.put(`/roles/${id}`, data);
  },

  deleteRole: (id: number): Promise<ApiResponse<void>> => {
    return request.delete(`/roles/${id}`);
  },
};

export default {
  authApi,
  userApi,
};
