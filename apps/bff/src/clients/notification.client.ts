import { createHttpClient } from '@csisp/upstream';

const client = createHttpClient({ baseURL: process.env.BE_NOTIFY_URL as string });
export async function getNotifications(userId: number) {
  return client.json(client.get(`/api/notification/list?userId=${userId}`));
}
