import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

// AES-256-GCM Aadhaar Encryption & Masking
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes
const AUTH_TAG_LENGTH = 16; // 16 bytes

function getEncryptionKey(): Buffer {
  let keyHex = ENV.AADHAAR_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length < 64) {
    // derive standard 32-byte key from SHA256
    return crypto.createHash('sha256').update(keyHex || 'kisan_setu_secret_default_key').digest();
  }
  return Buffer.from(keyHex.slice(0, 64), 'hex');
}

/**
 * Encrypts 12-digit Aadhaar number using AES-256-GCM
 */
export function encryptAadhaar(plainAadhaar: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plainAadhaar, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    // Fallback to secure one-way hash if crypto failure
    console.warn('Aadhaar AES encryption fallback to HMAC-SHA256');
    const hmac = crypto.createHmac('sha256', ENV.AADHAAR_ENCRYPTION_KEY).update(plainAadhaar).digest('hex');
    return `hash:${hmac}`;
  }
}

/**
 * Extracts and masks Aadhaar to format "XXXX XXXX 9012"
 */
export function maskAadhaar(last4Digits: string): string {
  return `XXXX XXXX ${last4Digits.slice(-4)}`;
}

/**
 * Validates Aadhaar format (strictly 12 numeric digits)
 */
export function validateAadhaarFormat(aadhaar: string): boolean {
  return /^[0-9]{12}$/.test(aadhaar.trim());
}

/**
 * Validates Indian 10-digit mobile number
 */
export function validateMobileFormat(mobile: string): boolean {
  return /^[6-9][0-9]{9}$/.test(mobile.trim());
}

// Bcrypt helpers
export async function hashPassword(plainPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

export async function comparePassword(plainPassword: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}

// JWT helpers
export interface TokenPayload {
  id: string;
  role: 'FARMER' | 'OFFICER';
  mobileNumber?: string;
  username?: string;
  fullName: string;
  centreId?: string | null;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
