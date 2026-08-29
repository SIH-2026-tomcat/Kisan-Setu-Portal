import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/security';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to proceed.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please log in again.',
    });
    return;
  }

  req.user = payload;
  next();
}

export function requireRole(role: 'FARMER' | 'OFFICER') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({
        success: false,
        message: `Access denied. Requires ${role} privileges.`,
      });
      return;
    }

    next();
  };
}
