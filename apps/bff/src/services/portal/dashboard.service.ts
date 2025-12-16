import { aggregateStudentDashboard } from '../common/aggregation.service';

export async function aggregatePortalDashboard(userId: number, traceId?: string) {
  const data = await aggregateStudentDashboard(userId, traceId);
  return data;
}
