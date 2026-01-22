import type {
  Course,
  Class,
  Teacher,
  TimeSlot,
  PaginationResponse,
  ApiResponse,
} from '@csisp/types';

import { request } from './request';

export const courseApi = {
  // 课程管理
  getCourses: (
    params?: any
  ): Promise<ApiResponse<PaginationResponse<Course>>> => {
    return request.get('/courses', { params });
  },

  getCourse: (id: number): Promise<ApiResponse<Course>> => {
    return request.get(`/courses/${id}`);
  },

  createCourse: (data: Partial<Course>): Promise<ApiResponse<Course>> => {
    return request.post('/courses', data);
  },

  updateCourse: (
    id: number,
    data: Partial<Course>
  ): Promise<ApiResponse<Course>> => {
    return request.put(`/courses/${id}`, data);
  },

  deleteCourse: (id: number): Promise<ApiResponse<void>> => {
    return request.delete(`/courses/${id}`);
  },

  // 班级管理
  getClasses: (
    params?: any
  ): Promise<ApiResponse<PaginationResponse<Class>>> => {
    return request.get('/classes', { params });
  },

  getClass: (id: number): Promise<ApiResponse<Class>> => {
    return request.get(`/classes/${id}`);
  },

  createClass: (data: Partial<Class>): Promise<ApiResponse<Class>> => {
    return request.post('/classes', data);
  },

  updateClass: (
    id: number,
    data: Partial<Class>
  ): Promise<ApiResponse<Class>> => {
    return request.put(`/classes/${id}`, data);
  },

  deleteClass: (id: number): Promise<ApiResponse<void>> => {
    return request.delete(`/classes/${id}`);
  },

  // 教师管理
  getTeachers: (
    params?: any
  ): Promise<ApiResponse<PaginationResponse<Teacher>>> => {
    return request.get('/teachers', { params });
  },

  getTeacher: (id: number): Promise<ApiResponse<Teacher>> => {
    return request.get(`/teachers/${id}`);
  },

  createTeacher: (data: Partial<Teacher>): Promise<ApiResponse<Teacher>> => {
    return request.post('/teachers', data);
  },

  updateTeacher: (
    id: number,
    data: Partial<Teacher>
  ): Promise<ApiResponse<Teacher>> => {
    return request.put(`/teachers/${id}`, data);
  },

  deleteTeacher: (id: number): Promise<ApiResponse<void>> => {
    return request.delete(`/teachers/${id}`);
  },

  // 时间段管理
  getTimeSlots: (
    params?: any
  ): Promise<ApiResponse<PaginationResponse<TimeSlot>>> => {
    return request.get('/time-slots', { params });
  },

  createTimeSlot: (data: Partial<TimeSlot>): Promise<ApiResponse<TimeSlot>> => {
    return request.post('/time-slots', data);
  },

  updateTimeSlot: (
    id: number,
    data: Partial<TimeSlot>
  ): Promise<ApiResponse<TimeSlot>> => {
    return request.put(`/time-slots/${id}`, data);
  },

  deleteTimeSlot: (id: number): Promise<ApiResponse<void>> => {
    return request.delete(`/time-slots/${id}`);
  },
};

export default courseApi;
