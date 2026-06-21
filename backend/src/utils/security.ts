import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { env } from '../config/env';

export const createAccessToken = (userId: string | bigint): string => {
  return jwt.sign({ sub: userId.toString() }, env.CodeMaster_SECRET_KEY, {
    expiresIn: '7d', // Go implementation had a 7-day or similar expiration
  });
};

export const verifyAccessToken = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, env.CodeMaster_SECRET_KEY) as jwt.JwtPayload;
    return decoded.sub || null;
  } catch (err) {
    return null;
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
