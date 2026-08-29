import { Router } from 'express';
import {
  registerFarmer,
  requestFarmerOTP,
  verifyFarmerOTP,
  officerLogin,
  getMe,
} from '../controllers/authController';
import {
  registrationLimiter,
  otpRequestLimiter,
  otpVerifyLimiter,
  officerLoginLimiter,
} from '../middleware/rateLimiter';
import {
  validateFarmerRegistration,
  validateOTPRequest,
  validateOTPVerification,
  validateOfficerLogin,
} from '../middleware/validation';
import { authenticate } from '../middleware/auth';

const router = Router();

// Farmer Auth Endpoints
router.post('/farmer/register', registrationLimiter, validateFarmerRegistration, registerFarmer);
router.post('/farmer/request-otp', otpRequestLimiter, validateOTPRequest, requestFarmerOTP);
router.post('/farmer/verify-otp', otpVerifyLimiter, validateOTPVerification, verifyFarmerOTP);

// Officer Auth Endpoint
router.post('/officer/login', officerLoginLimiter, validateOfficerLogin, officerLogin);

// Current User Profile
router.get('/me', authenticate, getMe);

export default router;
