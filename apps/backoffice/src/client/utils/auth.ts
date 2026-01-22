export async function checkLogin(): Promise<boolean> {
  try {
    const res = await fetch('/api/backoffice/auth/me', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        params: {},
        id: Date.now(),
      }),
      credentials: 'include',
    });
    const data = await res.json();
    return !!data?.result?.user && !data?.error;
  } catch {
    return false;
  }
}
