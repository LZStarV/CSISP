import { createHttpClient } from '@csisp/upstream';

const client = createHttpClient({ baseURL: process.env.BE_ATT_URL as string });
export async function getAttendanceSummary(userId: number) {
  return client.json(client.get(`/api/attendance/summary?userId=${userId}`));
}
