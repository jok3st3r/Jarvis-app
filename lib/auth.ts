/* eslint-disable */
// "Remember this device" login. The cookie holds a hash of the app username + password, so
// changing the password in Vercel signs every device out.
export const AUTH_COOKIE = 'jarvis_auth';
export const AUTH_MAX_AGE = 60 * 60 * 24 * 365; // one year

export async function authToken(): Promise<string | null> {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASSWORD;
  if (!user || !pass) return null;
  const data = new TextEncoder().encode(`jarvis-device:${user}:${pass}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
