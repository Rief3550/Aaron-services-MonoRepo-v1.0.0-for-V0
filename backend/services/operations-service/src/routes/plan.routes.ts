/**
 * Rutas de Planes
 */
import { Router } from 'express';

import { PlanController } from '../controllers/plan.controller';

const router = Router();

router.get('/', PlanController.list);
router.post('/', PlanController.create);
router.patch('/:id', PlanController.update);
router.get('/:id/price-history', PlanController.getPriceHistory);

export default router;

