import { Router } from 'express';
import {
  getOfficerDashboard,
  getOfficerQueue,
  callNextFarmer,
  markFarmerArrived,
  holdBooking,
  getReassignmentSlots,
  reassignBooking,
  cancelMissedBooking,
  processProcurement,
  updatePaymentStatus,
  getAuditLogs,
} from '../controllers/officerController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Strict RBAC: All officer routes require authenticated OFFICER role
router.use(authenticate);
router.use(requireRole('OFFICER'));

router.get('/dashboard', getOfficerDashboard);
router.get('/queue', getOfficerQueue);
router.post('/queue/next', callNextFarmer);
router.post('/mark-arrived', markFarmerArrived);
router.post('/bookings/:bookingId/hold', holdBooking);
router.get('/bookings/:bookingId/reassignment-slots', getReassignmentSlots);
router.post('/bookings/:bookingId/reassign', reassignBooking);
router.post('/bookings/:bookingId/cancel-missed', cancelMissedBooking);
router.patch('/procurement/:procurementId/status', processProcurement);
router.patch('/payments/:paymentId/status', updatePaymentStatus);
router.get('/audit', getAuditLogs);

export default router;
