import { request } from './request';
import type {
  Homework,
  HomeworkSubmission,
  HomeworkFile,
  HomeworkStat,
  PaginationResponse,
  ApiResponse,
  CreateHomeworkInput,
  UpdateHomeworkInput,
  CreateHomeworkSubmissionInput,
  UpdateHomeworkSubmissionInput,
} from '@csisp/types';

export const homeworkApi = {
  // 作业管理
  getHomeworks: (params?: any): Promise<ApiResponse<PaginationResponse<Homework>>> => {
    return request.get('/homework', { params });
  },

  getHomework: (id: number): Promise<ApiResponse<Homework>> => {
    return request.get(`/homework/${id}`);
  },

  createHomework: (data: CreateHomeworkInput): Promise<ApiResponse<Homework>> => {
    return request.post('/homework', data);
  },

  updateHomework: (id: number, data: UpdateHomeworkInput): Promise<ApiResponse<Homework>> => {
    return request.put(`/homework/${id}`, data);
  },

  deleteHomework: (id: number): Promise<ApiResponse<void>> => {
    return request.delete(`/homework/${id}`);
  },

  // 作业提交管理
  getHomeworkSubmissions: (
    homeworkId: number,
    params?: any
  ): Promise<ApiResponse<PaginationResponse<HomeworkSubmission>>> => {
    return request.get(`/homework/${homeworkId}/submissions`, { params });
  },

  submitHomework: (
    data: CreateHomeworkSubmissionInput
  ): Promise<ApiResponse<HomeworkSubmission>> => {
    return request.post('/homework/submit', data);
  },

  updateHomeworkSubmission: (
    id: number,
    data: UpdateHomeworkSubmissionInput
  ): Promise<ApiResponse<HomeworkSubmission>> => {
    return request.put(`/homework/submission/${id}`, data);
  },

  getHomeworkSubmission: (id: number): Promise<ApiResponse<HomeworkSubmission>> => {
    return request.get(`/homework/submission/${id}`);
  },

  // 作业文件管理
  getHomeworkFiles: (submissionId: number): Promise<ApiResponse<HomeworkFile[]>> => {
    return request.get(`/homework/submission/${submissionId}/files`);
  },

  uploadHomeworkFile: (submissionId: number, file: File): Promise<ApiResponse<HomeworkFile>> => {
    const formData = new FormData();
    formData.append('file', file);
    return request.post(`/homework/submission/${submissionId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteHomeworkFile: (fileId: number): Promise<ApiResponse<void>> => {
    return request.delete(`/homework/file/${fileId}`);
  },

  // 作业统计
  getHomeworkStats: (): Promise<ApiResponse<HomeworkStat>> => {
    return request.get('/homework/stats');
  },

  getHomeworkSubmissionStats: (homeworkId: number): Promise<ApiResponse<any>> => {
    return request.get(`/homework/${homeworkId}/submission-stats`);
  },

  // 批量操作
  batchDeleteHomeworks: (ids: number[]): Promise<ApiResponse<void>> => {
    return request.delete('/homework/batch', { data: { ids } });
  },

  // 作业评分
  gradeHomeworkSubmission: (
    submissionId: number,
    score: number,
    comment?: string
  ): Promise<ApiResponse<HomeworkSubmission>> => {
    return request.post(`/homework/submission/${submissionId}/grade`, { score, comment });
  },

  // 作业提醒
  sendHomeworkReminder: (homeworkId: number, userIds?: number[]): Promise<ApiResponse<void>> => {
    return request.post(`/homework/${homeworkId}/reminder`, { userIds });
  },
};
