import { getSequelize, health as pgHealth } from './client';
import { defineUserModel } from './models/user.model';

export const models: Record<string, any> = {};

export async function initModels(): Promise<void> {
  defineUserModel(models);
}

export function health() {
  return pgHealth();
}

export { getSequelize };
