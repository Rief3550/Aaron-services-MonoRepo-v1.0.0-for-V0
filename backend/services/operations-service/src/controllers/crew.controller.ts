/**
 * Controller de Cuadrillas
 */
import { Request, Response, NextFunction } from 'express';

import { CrewService } from '../services/crew.service';

export class CrewController {
  /**
   * GET /crews
   */
  static list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        state: req.query.state as any,
      };

      const result = await CrewService.listCrews(filters);

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
   * POST /crews
   */
  static create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await CrewService.createCrew(req.body);

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
   * PATCH /crews/:id/state
   */
  static updateState = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await CrewService.updateCrewState(req.params.id, req.body);

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
   * GET /crews/:id
   */
  static getWithOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await CrewService.getCrewWithOrders(req.params.id);

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
}

