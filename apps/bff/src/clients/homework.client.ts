import { createHttpClient } from '@csisp/upstream';

const client = createHttpClient({ baseURL: process.env.BE_HW_URL as string });
export async function getPendingHomework(userId: number) {
  return client.json(client.get(`/api/homework/pending?userId=${userId}`));
}
