import { Request, Response } from 'express';
import { prisma } from '../config/db';
import {
  encryptAadhaar,
  maskAadhaar,
  comparePassword,
  generateToken,
} from '../utils/security';
import { logSimulatedSMS } from '../utils/smsLogger';
import { createAuditLog } from '../services/auditService';
import { AuthenticatedRequest } from '../middleware/auth';

const DEMO_OTP = '123456';

/**
 * Register a new Farmer
 */
export async function registerFarmer(req: Request, res: Response): Promise<void> {
  try {
    const {
      fullName,
      mobileNumber,
      aadhaarNumber,
      village,
      district,
      state,
      centreId,
      preferredLanguage = 'en',
    } = req.body;

    // Check if mobile already registered
    const existing = await prisma.farmer.findUnique({
      where: { mobileNumber },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: 'This mobile number is already registered. Please proceed to Farmer Login.',
      });
      return;
    }

    // Encrypt Aadhaar and extract last 4 digits
    const aadhaarEncrypted = encryptAadhaar(aadhaarNumber);
    const aadhaarLast4 = aadhaarNumber.slice(-4);

    const farmer = await prisma.farmer.create({
      data: {
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        aadhaarEncrypted,
        aadhaarLast4,
        preferredLanguage,
        village: village.trim(),
        district: district.trim(),
        state: state.trim(),
        centreId: centreId || null,
      },
    });

    // Create welcome notification
    await prisma.notification.create({
      data: {
        farmerId: farmer.id,
        type: 'ACCOUNT_CREATED',
        title: 'Welcome to Kisan Setu',
        message: `Welcome ${farmer.fullName}! Your registration is complete. You can now book procurement slots.`,
      },
    });

    logSimulatedSMS(
      farmer.mobileNumber,
      `Welcome to Kisan Setu, ${farmer.fullName}! Your registration is successful. Identity verified for demo. Login anytime using OTP: 123456.`
    );

    const token = generateToken({
      id: farmer.id,
      role: 'FARMER',
      mobileNumber: farmer.mobileNumber,
      fullName: farmer.fullName,
      centreId: farmer.centreId,
    });

    res.status(201).json({
      success: true,
      message: 'Farmer registered successfully.',
      token,
      farmer: {
        id: farmer.id,
        fullName: farmer.fullName,
        mobileNumber: farmer.mobileNumber,
        aadhaarMasked: maskAadhaar(farmer.aadhaarLast4),
        preferredLanguage: farmer.preferredLanguage,
        village: farmer.village,
        district: farmer.district,
        state: farmer.state,
        centreId: farmer.centreId,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete farmer registration. Please try again.',
    });
  }
}

/**
 * Request OTP for Farmer Login
 */
export async function requestFarmerOTP(req: Request, res: Response): Promise<void> {
  try {
    const { mobileNumber } = req.body;

    const farmer = await prisma.farmer.findUnique({
      where: { mobileNumber: mobileNumber.trim() },
    });

    if (!farmer) {
      res.status(404).json({
        success: false,
        message: 'Mobile number not found. Please complete Farmer Registration first.',
      });
      return;
    }

    logSimulatedSMS(
      mobileNumber,
      `Kisan Setu: Your login OTP is ${DEMO_OTP}. Valid for 10 minutes. Do not share with anyone.`
    );

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your mobile number.',
      demoOtpNotice: 'Demo OTP: 123456',
      farmerName: farmer.fullName,
    });
  } catch (error) {
    console.error('OTP Request error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not send OTP. Please verify your connection.',
    });
  }
}

/**
 * Verify OTP and authenticate Farmer
 */
export async function verifyFarmerOTP(req: Request, res: Response): Promise<void> {
  try {
    const { mobileNumber, otp } = req.body;

    if (otp !== DEMO_OTP) {
      res.status(400).json({
        success: false,
        message: 'Invalid OTP entered. Please use the demo OTP: 123456.',
      });
      return;
    }

    const farmer = await prisma.farmer.findUnique({
      where: { mobileNumber: mobileNumber.trim() },
      include: {
        centre: true,
      },
    });

    if (!farmer) {
      res.status(404).json({
        success: false,
        message: 'Farmer account not found for this mobile number.',
      });
      return;
    }

    const token = generateToken({
      id: farmer.id,
      role: 'FARMER',
      mobileNumber: farmer.mobileNumber,
      fullName: farmer.fullName,
      centreId: farmer.centreId,
    });

    res.status(200).json({
      success: true,
      message: 'Authenticated successfully.',
      token,
      farmer: {
        id: farmer.id,
        fullName: farmer.fullName,
        mobileNumber: farmer.mobileNumber,
        aadhaarMasked: maskAadhaar(farmer.aadhaarLast4),
        preferredLanguage: farmer.preferredLanguage,
        village: farmer.village,
        district: farmer.district,
        state: farmer.state,
        centreId: farmer.centreId,
        centre: farmer.centre,
      },
    });
  } catch (error) {
    console.error('OTP Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.',
    });
  }
}

/**
 * Officer Login with bcrypt password authentication
 */
export async function officerLogin(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body;

    const officer = await prisma.officer.findUnique({
      where: { username: username.trim() },
      include: { centre: true },
    });

    if (!officer || !officer.active) {
      res.status(401).json({
        success: false,
        message: 'Invalid officer credentials or inactive account.',
      });
      return;
    }

    const isMatch = await comparePassword(password, officer.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
      return;
    }

    // Update last login
    await prisma.officer.update({
      where: { id: officer.id },
      data: { lastLogin: new Date() },
    });

    // Audit log
    await createAuditLog({
      officerId: officer.id,
      action: 'LOGIN',
      entityType: 'Officer',
      entityId: officer.id,
      details: `Officer ${officer.username} logged in for centre: ${officer.centre.name}`,
      ipAddress: req.ip,
    });

    const token = generateToken({
      id: officer.id,
      role: 'OFFICER',
      username: officer.username,
      fullName: officer.fullName,
      centreId: officer.centreId,
    });

    res.status(200).json({
      success: true,
      message: 'Officer login successful.',
      token,
      officer: {
        id: officer.id,
        username: officer.username,
        fullName: officer.fullName,
        role: officer.role,
        centreId: officer.centreId,
        centre: officer.centre,
      },
    });
  } catch (error) {
    console.error('Officer login error:', error);
    res.status(500).json({
      success: false,
      message: 'Officer authentication error.',
    });
  }
}

/**
 * Get current session user
 */
export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthenticated' });
      return;
    }

    if (req.user.role === 'FARMER') {
      const farmer = await prisma.farmer.findUnique({
        where: { id: req.user.id },
        include: { centre: true },
      });

      if (!farmer) {
        res.status(404).json({ success: false, message: 'Farmer not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        user: {
          id: farmer.id,
          role: 'FARMER',
          fullName: farmer.fullName,
          mobileNumber: farmer.mobileNumber,
          aadhaarMasked: maskAadhaar(farmer.aadhaarLast4),
          preferredLanguage: farmer.preferredLanguage,
          village: farmer.village,
          district: farmer.district,
          state: farmer.state,
          centreId: farmer.centreId,
          centre: farmer.centre,
        },
      });
      return;
    }

    if (req.user.role === 'OFFICER') {
      const officer = await prisma.officer.findUnique({
        where: { id: req.user.id },
        include: { centre: true },
      });

      if (!officer) {
        res.status(404).json({ success: false, message: 'Officer not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        user: {
          id: officer.id,
          role: 'OFFICER',
          username: officer.username,
          fullName: officer.fullName,
          centreId: officer.centreId,
          centre: officer.centre,
        },
      });
      return;
    }

    res.status(400).json({ success: false, message: 'Unknown role' });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
}
