import { createHttpClient } from '@csisp/upstream';

const client = createHttpClient({ baseURL: process.env.BE_COURSE_URL as string });
export async function getEnrolledCourses(userId: number) {
  return client.json(client.get(`/api/course/enrolled?userId=${userId}`));
}
