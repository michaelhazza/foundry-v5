import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d';

interface TokenPayload {
  userId: number;
  organisationId: number;
  role: 'admin' | 'member';
}

export const authService = {
  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  /**
   * Generate a JWT token
   */
  generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  },

  /**
   * Verify and decode a JWT token
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    } catch {
      return null;
    }
  },

  /**
   * Generate a secure random token for invitations and password resets
   */
  generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  },

  /**
   * Calculate expiration date for invitation tokens (7 days)
   */
  getInvitationExpiry(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  },

  /**
   * Calculate expiration date for password reset tokens (1 hour)
   */
  getPasswordResetExpiry(): Date {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    return date;
  },
};
