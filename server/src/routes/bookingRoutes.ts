import { Router } from 'express';
import { createBooking, getMyBookings, getBookingById } from '../controllers/bookingController';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBookingInput } from '../middleware/validation';

const router = Router();

router.use(authenticate);

// Farmer only: create and list bookings
router.post('/', requireRole('FARMER'), validateBookingInput, createBooking);
router.get('/me', requireRole('FARMER'), getMyBookings);
router.get('/:id', getBookingById);

export default router;
