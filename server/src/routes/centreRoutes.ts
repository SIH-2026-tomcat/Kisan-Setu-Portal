import { Router } from 'express';
import { getCentres, getCentreById, getCentreSlots } from '../controllers/centreController';

const router = Router();

router.get('/', getCentres);
router.get('/:id', getCentreById);
router.get('/:id/slots', getCentreSlots);

export default router;
