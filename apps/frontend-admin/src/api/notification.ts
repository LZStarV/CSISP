import type {
  Notification,
  PaginationResponse,
  ApiResponse,
  CreateNotificationInput,
} from '@csisp/types';

import { request } from './request';

export const notificationApi = {
  // 通知管理
  getNotifications: (
    params?: any
  ): Promise<ApiResponse<PaginationResponse<Notification>>> => {
    return request.get('/notifications', { params });
  },

  getNotification: (id: number): Promise<ApiResponse<Notification>> => {
    return request.get(`/notifications/${id}`);
  },

  createNotification: (
    data: CreateNotificationInput
  ): Promise<ApiResponse<Notification>> => {
    return request.post('/notifications', data);
  },

  updateNotification: (
    id: number,
    data: Partial<Notification>
  ): Promise<ApiResponse<Notification>> => {
    return request.put(`/notifications/${id}`, data);
  },

  deleteNotification: (id: number): Promise<ApiResponse<void>> => {
    return request.delete(`/notifications/${id}`);
  },

  // 通知阅读状态
  markAsRead: (id: number): Promise<ApiResponse<void>> => {
    return request.post(`/notifications/${id}/read`);
  },

  markAllAsRead: (): Promise<ApiResponse<void>> => {
    return request.post('/notifications/read-all');
  },

  getUnreadCount: (): Promise<ApiResponse<{ count: number }>> => {
    return request.get('/notifications/unread-count');
  },

  // 通知统计
  getNotificationStats: (params?: any): Promise<ApiResponse<any>> => {
    return request.get('/notifications/stats', { params });
  },

  // 批量操作
  batchDelete: (ids: number[]): Promise<ApiResponse<void>> => {
    return request.post('/notifications/batch-delete', { ids });
  },

  batchMarkAsRead: (ids: number[]): Promise<ApiResponse<void>> => {
    return request.post('/notifications/batch-read', { ids });
  },
};

export default notificationApi;
