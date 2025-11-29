import { aggregateStudentDashboard } from '../common/aggregation.service';

export async function aggregateAdminDashboard(userId: number) {
  const data = await aggregateStudentDashboard(userId);
  return data;
}
