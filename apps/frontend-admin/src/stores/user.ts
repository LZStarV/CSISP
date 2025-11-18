import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, Role, Permission, LoginParams, LoginResponse, UserState } from '@/types';
import { authApi, userApi } from '@/api';
import { useMessage } from 'naive-ui';

export const useUserStore = defineStore('user', () => {
  const state = ref<UserState>({
    currentUser: null,
    users: [],
    roles: [],
    permissions: [],
    loading: false,
  });

  const message = useMessage();

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
      const { token, user, roles } = response.data as LoginResponse;

      // 保存token
      localStorage.setItem('token', token);

      // 设置当前用户
      state.value.currentUser = user;
      state.value.roles = roles;

      // 获取用户权限
      await getUserPermissions(user.id);

      message.success('登录成功');
      return response;
    } catch (error) {
      message.error('登录失败，请检查用户名和密码');
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

      message.success('退出登录成功');
    }
  };

  const getUserInfo = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    state.value.loading = true;
    try {
      const response = await authApi.getUserInfo();
      const { user, roles } = response.data;

      state.value.currentUser = user;
      state.value.roles = roles;

      await getUserPermissions(user.id);
    } catch (error) {
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
      state.value.permissions = response.data;
    } catch (error) {
      console.error('Get user permissions error:', error);
    }
  };

  // 用户管理相关
  const getUsers = async (params?: any) => {
    state.value.loading = true;
    try {
      const response = await userApi.getUsers(params);
      state.value.users = response.data.data;
      return response.data;
    } catch (error) {
      message.error('获取用户列表失败');
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  const createUser = async (userData: Partial<User>) => {
    state.value.loading = true;
    try {
      const response = await userApi.createUser(userData);
      state.value.users.unshift(response.data);
      message.success('创建用户成功');
      return response.data;
    } catch (error) {
      message.error('创建用户失败');
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
      if (index !== -1) {
        state.value.users[index] = { ...state.value.users[index], ...response.data };
      }
      message.success('更新用户成功');
      return response.data;
    } catch (error) {
      message.error('更新用户失败');
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
      message.success('删除用户成功');
    } catch (error) {
      message.error('删除用户失败');
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  // 角色管理
  const getRoles = async () => {
    try {
      const response = await userApi.getRoles();
      state.value.roles = response.data;
      return response.data;
    } catch (error) {
      message.error('获取角色列表失败');
      throw error;
    }
  };

  const createRole = async (roleData: Partial<Role>) => {
    try {
      const response = await userApi.createRole(roleData);
      state.value.roles.push(response.data);
      message.success('创建角色成功');
      return response.data;
    } catch (error) {
      message.error('创建角色失败');
      throw error;
    }
  };

  const updateRole = async (id: number, roleData: Partial<Role>) => {
    try {
      const response = await userApi.updateRole(id, roleData);
      const index = state.value.roles.findIndex(r => r.id === id);
      if (index !== -1) {
        state.value.roles[index] = { ...state.value.roles[index], ...response.data };
      }
      message.success('更新角色成功');
      return response.data;
    } catch (error) {
      message.error('更新角色失败');
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
      message.success('删除角色成功');
    } catch (error) {
      message.error('删除角色失败');
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
