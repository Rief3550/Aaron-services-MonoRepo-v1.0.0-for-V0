/**
 * Rutas de Órdenes de Trabajo
 */
import { Router } from 'express';

import { WorkOrderController } from '../controllers/work-order.controller';

const router = Router();

router.get('/', WorkOrderController.list);
router.post('/', WorkOrderController.create);
router.patch('/:id/state', WorkOrderController.updateState);
router.patch('/:id/assign-crew/:crewId', WorkOrderController.assignCrew);
router.patch('/:id/progress', WorkOrderController.updateProgress);
router.get('/:id/timeline', WorkOrderController.getTimeline);

export default router;

