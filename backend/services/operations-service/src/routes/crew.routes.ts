/**
 * Rutas de Cuadrillas
 */
import { Router } from 'express';

import { CrewController } from '../controllers/crew.controller';

const router = Router();

router.get('/', CrewController.list);
router.post('/', CrewController.create);
router.get('/:id', CrewController.getWithOrders);
router.patch('/:id/state', CrewController.updateState);

export default router;

