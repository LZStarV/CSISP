import { z } from 'zod';

export const StudentDashboardQuery = z.object({
  userId: z.coerce.number().int().positive(),
});
