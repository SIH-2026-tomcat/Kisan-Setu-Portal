import { Request, Response, NextFunction } from 'express';
import { validateAadhaarFormat, validateMobileFormat } from '../utils/security';

export function validateFarmerRegistration(req: Request, res: Response, next: NextFunction): void {
  const { fullName, mobileNumber, aadhaarNumber, village, district, state } = req.body;

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    res.status(400).json({ success: false, message: 'Valid full name is required (minimum 2 characters).' });
    return;
  }

  if (!mobileNumber || !validateMobileFormat(mobileNumber)) {
    res.status(400).json({ success: false, message: 'Valid 10-digit Indian mobile number is required.' });
    return;
  }

  if (!aadhaarNumber || !validateAadhaarFormat(aadhaarNumber)) {
    res.status(400).json({ success: false, message: 'Valid 12-digit numeric Aadhaar number is required.' });
    return;
  }

  if (!village || !district || !state) {
    res.status(400).json({ success: false, message: 'Village, District, and State are mandatory.' });
    return;
  }

  next();
}

export function validateOTPRequest(req: Request, res: Response, next: NextFunction): void {
  const { mobileNumber } = req.body;
  if (!mobileNumber || !validateMobileFormat(mobileNumber)) {
    res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
    return;
  }
  next();
}

export function validateOTPVerification(req: Request, res: Response, next: NextFunction): void {
  const { mobileNumber, otp } = req.body;
  if (!mobileNumber || !validateMobileFormat(mobileNumber)) {
    res.status(400).json({ success: false, message: 'Valid 10-digit mobile number required.' });
    return;
  }
  if (!otp || typeof otp !== 'string' || otp.trim().length !== 6) {
    res.status(400).json({ success: false, message: 'Valid 6-digit OTP is required.' });
    return;
  }
  next();
}

export function validateOfficerLogin(req: Request, res: Response, next: NextFunction): void {
  const { username, password } = req.body;
  if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
    res.status(400).json({ success: false, message: 'Username and password are required.' });
    return;
  }
  next();
}

export function validateBookingInput(req: Request, res: Response, next: NextFunction): void {
  const { centreId, slotId, cropType, expectedQuantity } = req.body;
  if (!centreId || !slotId || !cropType) {
    res.status(400).json({ success: false, message: 'Centre, Slot, and Crop Type are required.' });
    return;
  }

  const qty = parseFloat(expectedQuantity);
  if (isNaN(qty) || qty <= 0 || qty > 1000) {
    res.status(400).json({ success: false, message: 'Expected quantity must be a positive number between 1 and 1000 Quintals.' });
    return;
  }
  next();
}
