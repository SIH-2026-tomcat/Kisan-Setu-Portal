import rateLimit from 'express-rate-limit';

export const otpRequestLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // max 10 requests per 5 minutes
  message: {
    success: false,
    message: 'Too many OTP requests from this IP. Please try again after a few minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    message: 'Too many OTP verification attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const officerLoginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many officer login attempts. Please try again after 10 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    message: 'Registration rate limit reached. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
