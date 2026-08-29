import { Router } from 'express';
import { getLiveQueue } from '../controllers/queueController';

const router = Router();

// Public / Farmer queue tracking route (polling supported every 3-5 seconds)
router.get('/:centreId', getLiveQueue);

export default router;
