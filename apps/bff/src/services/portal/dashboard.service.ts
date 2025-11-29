import { aggregateStudentDashboard } from '../common/aggregation.service';

export async function aggregatePortalDashboard(userId: number) {
  const data = await aggregateStudentDashboard(userId);
  return data;
}
