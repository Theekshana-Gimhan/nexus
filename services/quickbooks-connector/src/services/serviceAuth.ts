import axios from 'axios';

let cached: { token: string; expiresAt: number } | null = null;

export async function getServiceToken(identityBase: string, clientId: string, clientSecret: string) {
  const now = Date.now();
  if (cached && cached.expiresAt - 5000 > now) return cached.token;

  const res = await axios.post(`${identityBase}/auth/service-token`, { clientId, clientSecret });
  const token = res.data?.data?.accessToken;
  const expiresIn = res.data?.data?.expiresIn || 3600;
  cached = { token, expiresAt: now + expiresIn * 1000 };
  return token;
}

export function clearCache(){ cached = null; }
