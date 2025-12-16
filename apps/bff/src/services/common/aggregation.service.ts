import { createHttpClient } from '@csisp/upstream';

export async function aggregateStudentDashboard(userId: number, traceId?: string) {
  const headers = traceId ? { 'X-Trace-Id': traceId } : undefined;
  const course = createHttpClient({ baseURL: process.env.BE_COURSE_URL as string, headers });
  const att = createHttpClient({ baseURL: process.env.BE_ATT_URL as string, headers });
  const hw = createHttpClient({ baseURL: process.env.BE_HW_URL as string, headers });
  const c = course.json(course.get(`/api/course/enrolled?userId=${userId}`));
  const a = att.json(att.get(`/api/attendance/summary?userId=${userId}`));
  const h = hw.json(hw.get(`/api/homework/pending?userId=${userId}`));
  const [courses, attendanceStats, pendingHomework] = await Promise.all([c, a, h]);
  return { courses, attendanceStats, pendingHomework };
}
