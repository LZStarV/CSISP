import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, Role, Permission, LoginParams, LoginResponse, UserState } from '@/types';
import { authApi, userApi } from '@/api';

export const useUserStore = defineStore('user', () => {
  const state = ref<UserState>({
    currentUser: null,
    users: [],
    roles: [],
    permissions: [],
    loading: false,
  });

  // Getters
  const isLoggedIn = computed(() => !!state.value.currentUser);
  const hasPermission = computed(() => (permission: string) => {
    return state.value.permissions.some(p => p.code === permission);
  });
  const hasRole = computed(() => (roleCode: string) => {
    return state.value.roles.some(r => r.code === roleCode);
  });

  // Actions
  const login = async (params: LoginParams) => {
    state.value.loading = true;
    try {
      const response = await authApi.login(params);
      const { token, user, roles } = response.data || {};

      if (!token || !user) {
        throw new Error('登录响应数据不完整');
      }

      // 保存token
      localStorage.setItem('token', token);

      // 设置当前用户
      state.value.currentUser = user;

      // 转换角色数据格式
      if (roles && Array.isArray(roles)) {
        // 如果roles是字符串数组(UserRoleType[])，需要转换为Role对象数组
        state.value.roles = roles.map((role: any) => {
          if (typeof role === 'string') {
            // 根据角色代码创建Role对象
            return {
              id: 0, // 临时ID
              name: role === 'admin' ? '管理员' : role === 'teacher' ? '教师' : '学生',
              code: role,
              description: `${role}角色`,
              status: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }
          return role;
        });
      } else {
        state.value.roles = [];
      }

      // 获取用户权限
      if (user?.id) {
        await getUserPermissions(user.id);
      }

      return response;
    } catch {
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      console.error('Logout error:', error);
    } finally {
      // 清除本地数据
      localStorage.removeItem('token');
      state.value.currentUser = null;
      state.value.roles = [];
      state.value.permissions = [];
    }
  };

  const getUserInfo = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    state.value.loading = true;
    try {
      const response = await authApi.getUserInfo();
      const { user, roles } = response.data || {};

      if (user) {
        state.value.currentUser = user;

        // 转换角色数据格式
        if (roles && Array.isArray(roles)) {
          // 如果roles是字符串数组(UserRoleType[])，需要转换为Role对象数组
          state.value.roles = roles.map((role: any) => {
            if (typeof role === 'string') {
              // 根据角色代码创建Role对象
              return {
                id: 0, // 临时ID
                name: role === 'admin' ? '管理员' : role === 'teacher' ? '教师' : '学生',
                code: role,
                description: `${role}角色`,
                status: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
            }
            return role;
          });
        } else {
          state.value.roles = [];
        }

        if (user.id) {
          await getUserPermissions(user.id);
        }
      }
    } catch {
      console.error('Get user info error:', error);
      // Token 无效，清除登录状态
      localStorage.removeItem('token');
    } finally {
      state.value.loading = false;
    }
  };

  const getUserPermissions = async (userId: number) => {
    try {
      const response = await userApi.getUserPermissions(userId);
      state.value.permissions = response.data || [];
    } catch {
      console.error('Get user permissions error', error);
    }
  };

  // 用户管理相关
  const getUsers = async (params?: any) => {
    state.value.loading = true;
    try {
      const response = await userApi.getUsers(params);
      state.value.users = response.data?.data || [];
      return response.data;
    } catch {
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  const createUser = async (userData: Partial<User>) => {
    state.value.loading = true;
    try {
      const response = await userApi.createUser(userData);
      if (response.data) {
        state.value.users.unshift(response.data);
      }
      return response.data;
    } catch {
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  const updateUser = async (id: number, userData: Partial<User>) => {
    state.value.loading = true;
    try {
      const response = await userApi.updateUser(id, userData);
      const index = state.value.users.findIndex(u => u.id === id);
      if (index !== -1 && response.data) {
        state.value.users[index] = { ...state.value.users[index], ...response.data };
      }
      return response.data;
    } catch {
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  const deleteUser = async (id: number) => {
    state.value.loading = true;
    try {
      await userApi.deleteUser(id);
      const index = state.value.users.findIndex(u => u.id === id);
      if (index !== -1) {
        state.value.users.splice(index, 1);
      }
    } catch {
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  // 角色管理
  const getRoles = async () => {
    try {
      const response = await userApi.getRoles();
      state.value.roles = response.data || [];
      return response.data;
    } catch {
      throw error;
    }
  };

  const createRole = async (roleData: Partial<Role>) => {
    try {
      const response = await userApi.createRole(roleData);
      if (response.data) {
        state.value.roles.push(response.data);
      }
      return response.data;
    } catch {
      throw error;
    }
  };

  const updateRole = async (id: number, roleData: Partial<Role>) => {
    try {
      const response = await userApi.updateRole(id, roleData);
      const index = state.value.roles.findIndex(r => r.id === id);
      if (index !== -1 && response.data) {
        state.value.roles[index] = { ...state.value.roles[index], ...response.data };
      }
      return response.data;
    } catch {
      throw error;
    }
  };

  const deleteRole = async (id: number) => {
    try {
      await userApi.deleteRole(id);
      const index = state.value.roles.findIndex(r => r.id === id);
      if (index !== -1) {
        state.value.roles.splice(index, 1);
      }
    } catch {
      throw error;
    }
  };

  return {
    // State
    state,

    // Getters
    isLoggedIn,
    hasPermission,
    hasRole,

    // Actions
    login,
    logout,
    getUserInfo,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getRoles,
    createRole,
    updateRole,
    deleteRole,
  };
});
