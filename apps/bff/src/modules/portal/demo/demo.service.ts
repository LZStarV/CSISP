export async function demoTestService(): Promise<{
  ok: boolean;
  project: string;
}> {
  return { ok: true, project: 'portal' };
}
