// 前端类型定义

import type {
  User,
  Course,
  Class,
  Teacher,
  TimeSlot,
  Attendance,
  Homework,
  HomeworkSubmission,
  Notification,
  Role,
  Permission,
  ApiResponse,
  PaginationResponse,
  PaginationParams,
  LoginResponse,
  LoginParams,
  Status,
  Semester,
  UserRoleType,
} from '@csisp/types';

// 重新导出所有类型
export type {
  User,
  Course,
  Class,
  Teacher,
  TimeSlot,
  Attendance,
  Homework,
  HomeworkSubmission,
  Notification,
  Role,
  Permission,
  ApiResponse,
  PaginationResponse,
  PaginationParams,
  LoginResponse,
  LoginParams,
  Status,
  Semester,
  UserRoleType,
};

// 前端专用类型
export interface TableColumn<T = any> {
  key: keyof T | string;
  title: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: T, index: number) => any;
}

export interface FormField {
  key: string;
  label: string;
  type: 'input' | 'select' | 'textarea' | 'number' | 'date' | 'switch';
  required?: boolean;
  options?: { label: string; value: any }[];
  rules?: any[];
  placeholder?: string;
}

export interface SearchField {
  key: string;
  label: string;
  type: 'input' | 'select' | 'date' | 'daterange';
  options?: { label: string; value: any }[];
  placeholder?: string;
}

export interface ModalConfig {
  title: string;
  width?: string | number;
  okText?: string;
  cancelText?: string;
  onOk?: () => void;
  onCancel?: () => void;
}

export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  path: string;
  children?: MenuItem[];
  permission?: string;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface PageInfo {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
}

// 权限相关类型
export interface PermissionCheck {
  permission: string;
  fallback?: any;
}

// 组件props类型
export interface BaseTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: boolean | PaginationConfig;
  rowKey?: string | ((row: T) => string);
  selectable?: boolean;
  onSelect?: (selectedRowKeys: string[], selectedRows: T[]) => void;
}

export interface BaseFormProps {
  fields: FormField[];
  model: Record<string, any>;
  loading?: boolean;
  labelWidth?: string | number;
  rules?: Record<string, any[]>;
}

export interface BaseSearchProps {
  fields: SearchField[];
  model: Record<string, any>;
  loading?: boolean;
  onSearch: () => void;
  onReset: () => void;
}

export interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  pageSizeOptions?: string[];
  onChange?: (page: number, pageSize: number) => void;
}

// 状态管理类型
export interface UserState {
  currentUser: User | null;
  users: User[];
  roles: Role[];
  permissions: Permission[];
  loading: boolean;
}

export interface CourseState {
  courses: Course[];
  classes: Class[];
  teachers: Teacher[];
  timeSlots: TimeSlot[];
  loading: boolean;
}

export interface AttendanceState {
  attendanceRecords: Attendance[];
  loading: boolean;
}

export interface HomeworkState {
  homeworkList: Homework[];
  submissions: HomeworkSubmission[];
  loading: boolean;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
}

export interface AppState {
  collapsed: boolean;
  theme: 'light' | 'dark';
  loading: boolean;
}
