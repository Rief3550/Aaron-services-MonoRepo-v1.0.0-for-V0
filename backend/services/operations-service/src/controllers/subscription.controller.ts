/**
 * Controller de Suscripciones
 */
import { Request, Response, NextFunction } from 'express';

import { SubscriptionService } from '../services/subscription.service';

export class SubscriptionController {
  /**
   * GET /subscriptions
   */
  static list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.query.userId as string | undefined;
      const status = req.query.status as string | undefined;

      const result = await SubscriptionService.listSubscriptions(userId, status);

      if (result._tag === 'error') {
        return res.status(400).json({
          success: false,
          error: { message: result.error.message },
        });
      }

      res.json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /subscriptions
   */
  static create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await SubscriptionService.createSubscription(req.body);

      if (result._tag === 'error') {
        return res.status(400).json({
          success: false,
          error: { message: result.error.message },
        });
      }

      res.status(201).json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /subscriptions/:id/upgrade
   */
  static upgrade = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { planId } = req.body;
      const result = await SubscriptionService.upgradeSubscription(req.params.id, planId);

      if (result._tag === 'error') {
        return res.status(400).json({
          success: false,
          error: { message: result.error.message },
        });
      }

      res.json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /subscriptions/:id/cancel
   */
  static cancel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await SubscriptionService.cancelSubscription(req.params.id);

      if (result._tag === 'error') {
        return res.status(400).json({
          success: false,
          error: { message: result.error.message },
        });
      }

      res.json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /subscriptions/:id/charge
   */
  static charge = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await SubscriptionService.processCharge(req.params.id);

      if (result._tag === 'error') {
        return res.status(400).json({
          success: false,
          error: { message: result.error.message },
        });
      }

      res.json({
        success: true,
        data: result.value,
      });
    } catch (error) {
      next(error);
    }
  };
}

