import { request } from './request';
import type {
  AttendanceTask,
  AttendanceRecord,
  AttendanceStatus,
  CreateAttendanceTaskInput,
  UpdateAttendanceTaskInput,
  CreateAttendanceRecordInput,
  UpdateAttendanceRecordInput,
  AttendanceDetail,
  CheckinParams,
  AttendanceStat,
  StudentAttendanceStat,
  PaginationResponse,
  ApiResponse,
} from '@csisp/types';

export const attendanceApi = {
  // 考勤任务管理
  getAttendanceTasks: (params?: any): Promise<ApiResponse<PaginationResponse<AttendanceTask>>> => {
    return request.get('/attendance/tasks', { params });
  },

  getAttendanceTask: (id: number): Promise<ApiResponse<AttendanceTask>> => {
    return request.get(`/attendance/tasks/${id}`);
  },

  createAttendanceTask: (data: CreateAttendanceTaskInput): Promise<ApiResponse<AttendanceTask>> => {
    return request.post('/attendance/tasks', data);
  },

  updateAttendanceTask: (
    id: number,
    data: Partial<AttendanceTask>
  ): Promise<ApiResponse<AttendanceTask>> => {
    return request.put(`/attendance/tasks/${id}`, data);
  },

  deleteAttendanceTask: (id: number): Promise<ApiResponse<void>> => {
    return request.delete(`/attendance/tasks/${id}`);
  },

  // 学生打卡
  checkIn: (data: CheckinParams): Promise<ApiResponse<AttendanceRecord>> => {
    return request.post('/attendance/checkin', data);
  },

  // 考勤记录
  getAttendanceRecords: (
    params?: any
  ): Promise<ApiResponse<PaginationResponse<AttendanceRecord>>> => {
    return request.get('/attendance/records', { params });
  },

  getAttendanceRecord: (id: number): Promise<ApiResponse<AttendanceRecord>> => {
    return request.get(`/attendance/records/${id}`);
  },

  updateAttendanceRecord: (
    id: number,
    data: Partial<AttendanceRecord>
  ): Promise<ApiResponse<AttendanceRecord>> => {
    return request.put(`/attendance/records/${id}`, data);
  },

  // 考勤统计
  getAttendanceStats: (params?: any): Promise<ApiResponse<AttendanceStat>> => {
    return request.get('/attendance/stats', { params });
  },

  getClassAttendanceStats: (
    classId: number,
    params?: any
  ): Promise<ApiResponse<AttendanceStat>> => {
    return request.get(`/attendance/stats/class/${classId}`, { params });
  },
  getCourseAttendanceStats: (
    courseId: number,
    params?: any
  ): Promise<ApiResponse<AttendanceStat>> => {
    return request.get(`/attendance/stats/course/${courseId}`, { params });
  },

  // 批量操作
  batchCheckIn: (data: { taskId: number; studentIds: number[] }): Promise<ApiResponse<void>> => {
    return request.post('/attendance/batch-checkin', data);
  },

  exportAttendanceRecords: (params?: any): Promise<ApiResponse<string>> => {
    return request.get('/attendance/export', { params });
  },
};

export default attendanceApi;
