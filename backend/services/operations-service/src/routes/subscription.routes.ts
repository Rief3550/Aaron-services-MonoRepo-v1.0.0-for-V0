/**
 * Rutas de Suscripciones
 */
import { Router } from 'express';

import { SubscriptionController } from '../controllers/subscription.controller';

const router = Router();

router.get('/', SubscriptionController.list);
router.post('/', SubscriptionController.create);
router.patch('/:id/upgrade', SubscriptionController.upgrade);
router.patch('/:id/cancel', SubscriptionController.cancel);
router.patch('/:id/charge', SubscriptionController.charge);

export default router;

