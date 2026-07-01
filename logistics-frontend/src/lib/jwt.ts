import { jwtDecode } from 'jwt-decode';

const ROLE_CLAIM_KEYS = [
  'role',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role',
] as const;

interface JwtPayload {
  sub?: string;
  unique_name?: string;
  name?: string;
  role?: string | string[];
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string | string[];
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'?: string | string[];
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'?: string;
}

export function extractRoleFromToken(token: string): string | null {
  try {
    const payload = jwtDecode<JwtPayload>(token);

    for (const key of ROLE_CLAIM_KEYS) {
      const value = payload[key];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
      if (Array.isArray(value) && value.length > 0) {
        return value[0];
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function extractUsernameFromToken(token: string): string | null {
  try {
    const payload = jwtDecode<JwtPayload>(token);
    return (
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ??
      payload.unique_name ??
      payload.name ??
      payload.sub ??
      null
    );
  } catch {
    return null;
  }
}
