import { Router } from 'express';
import {
  getMyProcurements,
  getMyPayments,
  getMyNotifications,
  markNotificationRead,
  handleAssistantMessage,
} from '../controllers/farmerController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireRole('FARMER'));

router.get('/procurements', getMyProcurements);
router.get('/payments', getMyPayments);
router.get('/notifications', getMyNotifications);
router.patch('/notifications/:id/read', markNotificationRead);
router.post('/assistant/message', handleAssistantMessage);

export default router;
