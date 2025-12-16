import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { ApiResponse } from '@csisp/types';

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: (import.meta as any).env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  config => {
    // 添加token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response;

    // 业务码规范：接受 code === 0 或 2xx 视为成功
    if (typeof data?.code === 'number') {
      const code = data.code as number;
      const ok = code === 0 || (code >= 200 && code < 300);
      if (!ok) {
        return Promise.reject(new Error(data.message || '请求失败'));
      }
    }

    return response;
  },
  error => {
    const status = error.response?.status;
    if (status === 401) {
      localStorage.removeItem('token');
    }

    return Promise.reject(error);
  }
);

// API请求工具函数
export const request = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return apiClient.get(url, config).then(response => response.data);
  },

  post: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    return apiClient.post(url, data, config).then(response => response.data);
  },

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return apiClient.put(url, data, config).then(response => response.data);
  },

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return apiClient.delete(url, config).then(response => response.data);
  },
};

export default apiClient;
