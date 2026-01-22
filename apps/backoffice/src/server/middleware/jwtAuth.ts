import { verify } from '@/src/server/auth/jwt';

export function withAuth(ctx: Record<string, any>) {
  const auth = ctx.headers?.get?.('authorization') || '';
  const parts = auth.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    try {
      ctx.state = ctx.state || {};
      ctx.state.user = verify(parts[1]);
    } catch {
      // ignore invalid tokens; controller/roles will enforce
    }
  }
  return { user: ctx.state?.user };
}
