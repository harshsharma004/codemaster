import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root directory (matching Go backend behavior)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  PORT: z.string().default('4000'),
  CodeMaster_DATABASE_URL: z.string(),
  CodeMaster_CORS_ORIGINS: z.string().default('http://localhost:5173'),
  CodeMaster_ALLOWED_HOSTS: z.string().default('127.0.0.1,localhost'),
  CodeMaster_SECRET_KEY: z.string().default('dev_secret_key_change_me'),
  CodeMaster_ENVIRONMENT: z.string().default('development'),
  CodeMaster_AUTH_RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().default(5),
  CodeMaster_AUTH_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().default(300),
  CodeMaster_GOOGLE_CLIENT_ID: z.string().optional(),
  CodeMaster_ENABLE_ADMIN: z.string().default('false').transform(v => v === 'true'),
  CodeMaster_ADMIN_EMAILS: z.string().default(''),
});

export const env = envSchema.parse(process.env);
