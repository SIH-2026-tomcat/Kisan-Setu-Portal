import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // fallback to current dir

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL || 'mysql://kisan_setu_user:KisanSetu@2026@localhost:3306/kisan_setu',
  JWT_SECRET: process.env.JWT_SECRET || 'kisan_setu_super_secure_jwt_secret_key_2026_sih',
  AADHAAR_ENCRYPTION_KEY: process.env.AADHAAR_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
};
