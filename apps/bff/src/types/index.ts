import type { Course } from '@csisp/types';
import type { AttendanceStat } from '@csisp/types';
import type { Homework } from '@csisp/types';

export type StudentDashboard = {
  courses: Course[];
  attendanceStats: AttendanceStat;
  pendingHomework: Homework[];
};
