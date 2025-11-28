/**
 * Controller de Planes
 */
import { Request, Response, NextFunction } from 'express';

import { PlanService } from '../services/plan.service';

export class PlanController {
  /**
   * GET /plans
   */
  static list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const activeOnly = req.query.activeOnly !== 'false';
      const result = await PlanService.listPlans(activeOnly);

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
   * POST /plans
   */
  static create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await PlanService.createPlan(req.body);

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
   * PATCH /plans/:id
   */
  static update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await PlanService.updatePlan(req.params.id, req.body);

      if (result._tag === 'error') {
        return res.status(404).json({
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
   * GET /plans/:id/price-history
   */
  static getPriceHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await PlanService.getPriceHistory(req.params.id);

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

