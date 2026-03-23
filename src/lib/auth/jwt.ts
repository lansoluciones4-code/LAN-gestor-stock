import { SignJWT, jwtVerify } from 'jose';
import type { UserSession } from '@/types';

// The secret key used to sign and verify JWT tokens.
// Fallback to a default for development if not provided.
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dev_key_change_me_later';
const secretKey = new TextEncoder().encode(JWT_SECRET);

/**
 * Creates a signed JWT for a given user session payload.
 *
 * @param payload - The user session data
 * @param expiresIn - The expiration time of the token
 * @returns A promise that resolves to the token string
 */
export async function signToken(
  payload: UserSession,
  expiresIn: string = '24h'
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

/**
 * Computes the verification of a JWT token and returns its payload.
 * Throws an error if the token is invalid or expired.
 *
 * @param token - The JWT string
 * @returns A promise that resolves to the decoded session payload
 */
export async function verifyToken(token: string): Promise<UserSession> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as UserSession;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
