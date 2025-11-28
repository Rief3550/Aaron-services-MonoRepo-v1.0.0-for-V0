/**
 * Controller de Órdenes de Trabajo
 */
import { Request, Response, NextFunction } from 'express';

import { WorkOrderService } from '../services/work-order.service';

export class WorkOrderController {
  /**
   * GET /work-orders
   */
  static list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 20;

      const filters = {
        customerId: req.query.customerId as string | undefined,
        crewId: req.query.crewId as string | undefined,
        state: req.query.state as string | undefined,
        type: req.query.type as string | undefined,
      };

      const result = await WorkOrderService.listWorkOrders(filters, skip, take);

      if (result._tag === 'error') {
        return res.status(400).json({
          success: false,
          error: { message: result.error.message },
        });
      }

      res.json({
        success: true,
        ...result.value,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /work-orders
   */
  static create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await WorkOrderService.createWorkOrder(req.body);

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
   * PATCH /work-orders/:id/state
   */
  static updateState = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await WorkOrderService.updateWorkOrderState(req.params.id, req.body);

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
   * PATCH /work-orders/:id/assign-crew/:crewId
   */
  static assignCrew = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await WorkOrderService.assignCrew(req.params.id, req.params.crewId);

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
   * PATCH /work-orders/:id/progress
   */
  static updateProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { progress } = req.body;
      const result = await WorkOrderService.updateProgress(req.params.id, progress);

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
   * GET /work-orders/:id/timeline
   */
  static getTimeline = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const analyze = req.query.analyze === 'true';

      if (analyze) {
        // Timeline agrupado por jornada con análisis de productividad
        const result = await WorkOrderService.getTimelineAnalysis(req.params.id);

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
      } else {
        // Timeline simple
        const result = await WorkOrderService.getTimeline(req.params.id);

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
      }
    } catch (error) {
      next(error);
    }
  };
}

