import { z } from 'zod';

export const StudentDashboardQuery = z.object({
  userId: z.coerce.number().int().positive(),
});

export const AdminOverviewQuery = z.object({
  days: z.coerce.number().int().min(1).max(180).default(30).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
});
