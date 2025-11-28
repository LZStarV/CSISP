import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { UserState, User } from '@/types';
import { authApi, userApi } from '@/api';

export const useUserStore = defineStore('user', () => {
  const state = ref<UserState>({
    currentUser: null,
    users: [],
    roles: [],
    permissions: [],
    loading: false,
  });

  // 登录
  const login = async (credentials: { username: string; password: string }) => {
    state.value.loading = true;
    try {
      const response = await authApi.login(credentials);
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response;
    } catch (error) {
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  // 获取当前用户信息
  const getCurrentUser = async () => {
    state.value.loading = true;
    try {
      const response = await authApi.getUserInfo();
      const user = response.data?.user;
      state.value.currentUser = user ? mapUser(user as any) : null;

      // 获取用户角色
      if (user?.id) {
        const rolesResponse = await userApi.getUserRoles(user.id);
        state.value.roles = rolesResponse.data || [];
      } else {
        state.value.roles = [];
      }

      // 获取用户权限
      if (user?.id) {
        // 后端暂未提供权限接口，置空
        state.value.permissions = [];
      }

      return response;
    } catch (error) {
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // 清除本地数据
      localStorage.removeItem('token');
      state.value.currentUser = null;
      state.value.roles = [];
      state.value.permissions = [];
    }
  };

  // 获取用户列表
  const getUsers = async (params?: any) => {
    state.value.loading = true;
    try {
      const response = await userApi.getUsers(params);
      const list = response.data?.data || [];
      state.value.users = Array.isArray(list) ? list.map(mapUser) : [];
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  // 创建用户
  const createUser = async (userData: Partial<User>) => {
    state.value.loading = true;
    try {
      const response = await userApi.createUser(userData);
      if (response.data) {
        state.value.users.unshift(mapUser(response.data as any));
      }
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  // 更新用户
  const updateUser = async (id: number, userData: Partial<User>) => {
    state.value.loading = true;
    try {
      const response = await userApi.updateUser(id, userData);
      const index = state.value.users.findIndex(u => u.id === id);
      if (index !== -1 && response.data) {
        const mapped = mapUser({ ...state.value.users[index], ...response.data } as any);
        state.value.users[index] = mapped;
      }
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  // 删除用户
  const deleteUser = async (id: number) => {
    state.value.loading = true;
    try {
      await userApi.deleteUser(id);
      const index = state.value.users.findIndex(u => u.id === id);
      if (index !== -1) {
        state.value.users.splice(index, 1);
      }
    } catch (error) {
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  // 获取用户角色
  const getUserRoles = async (userId: number) => {
    try {
      // 从用户信息中获取角色，不单独调用API
      if (state.value.currentUser?.id === userId) {
        return state.value.roles;
      }
      return [];
    } catch (error) {
      console.error('Get user roles error:', error);
      return [];
    }
  };

  // 获取用户权限
  const getUserPermissions = async (userId: number) => {
    try {
      // 后端暂未提供权限接口
      state.value.permissions = [];
      return [];
    } catch (error) {
      console.error('Get user permissions error', error);
      state.value.permissions = [];
      return [];
    }
  };

  // 分配角色 - 暂不支持
  const assignRole = async (userId: number, roleId: number) => {
    console.warn('角色分配功能暂不支持');
    return null;
  };

  // 移除角色 - 暂不支持
  const removeRole = async (userId: number, roleId: number) => {
    console.warn('角色移除功能暂不支持');
    return null;
  };

  // 获取角色列表
  const getRoles = async (params?: any) => {
    try {
      const response = await userApi.getRoles();
      state.value.roles = response.data || [];
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // 获取权限列表 - 暂不支持
  const getPermissions = async (params?: any) => {
    console.warn('权限列表功能暂不支持');
    return [];
  };

  return {
    state,
    login,
    logout,
    getCurrentUser,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getUserRoles,
    getUserPermissions,
    assignRole,
    removeRole,
    getRoles,
    getPermissions,
  };
});
const mapUser = (raw: any): User => ({
  id: raw.id,
  username: raw.username,
  password: raw.password,
  studentId: raw.student_id ?? raw.studentId,
  enrollmentYear: raw.enrollment_year ?? raw.enrollmentYear,
  major: raw.major,
  realName: raw.real_name ?? raw.realName,
  status: raw.status,
  createdAt: raw.created_at ?? raw.createdAt,
  updatedAt: raw.updated_at ?? raw.updatedAt,
});
