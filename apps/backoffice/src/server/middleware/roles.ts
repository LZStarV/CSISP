export function requireAdmin(ctx: Record<string, any>) {
  const roles: string[] = ctx.state?.user?.roles ?? [];
  const ok = Array.isArray(roles) && roles.includes('admin');
  if (!ok) {
    const err = new Error('Forbidden: admin only');
    (err as any).code = -32602;
    throw err;
  }
}
