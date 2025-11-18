import { request } from './request';
import type {
  LoginParams,
  LoginResponse,
  User,
  Role,
  Permission,
  PaginationResponse,
  ApiResponse,
} from '@csisp/types';

export const authApi = {
  // 用户登录
  login: (params: LoginParams): Promise<ApiResponse<LoginResponse>> => {
    return request.post('/auth/login', params);
  },

  // 用户登出
  logout: (): Promise<ApiResponse<void>> => {
    return request.post('/auth/logout');
  },

  // 获取用户信息
  getUserInfo: (): Promise<ApiResponse<{ user: User; roles: Role[] }>> => {
    return request.get('/auth/user-info');
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
    return request.get(`/users/${userId}/permissions`);
  },

  // 角色管理
  getRoles: (): Promise<ApiResponse<Role[]>> => {
    return request.get('/roles');
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
