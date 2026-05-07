import { SignJWT, jwtVerify } from 'jose';
import { UserSession, userSessionSchema } from '@/features/auth/domain/auth.schema';

const JWT_SECRET = process.env.JWT_SECRET || 'AuAsL3XRmf7g2XG7e82Pfwlj6xeytKUJu0ZxpJmAG6S';
const secretKey = new TextEncoder().encode(JWT_SECRET);

/**
 * Creates a signed JWT for a given user session payload.
 *
 * @param payload - The user session data
 * @param expiresIn - The expiration time of the token
 * @returns A promise that resolves to the token string
 */
export async function signToken(payload: UserSession, expiresIn: string = '24h'): Promise<string> {
  return new SignJWT({ ...payload }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(expiresIn).sign(secretKey);
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
    return userSessionSchema.parse(payload);
  } catch (error) {
    throw new Error('El token es inválido o ha expirado');
  }
}
