/**
 * Unit tests for WorkOrderService
 */
import { prisma } from '../config/database';

import { WorkOrderService } from './work-order.service';

jest.mock('../config/database');

describe('WorkOrderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createWorkOrder', () => {
    it('should create a work order', async () => {
      const mockOrder = {
        id: 'order-123',
        customerId: 'customer-123',
        address: '123 Test St',
        type: 'repair',
        state: 'pendiente',
      };

      (prisma.workOrder.create as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.workOrderEvent.create as jest.Mock).mockResolvedValue({});

      const result = await WorkOrderService.createWorkOrder({
        customerId: 'customer-123',
        address: '123 Test St',
        type: 'repair',
      });

      expect(result._tag).toBe('ok');
      if (result._tag === 'ok') {
        expect(result.value.id).toBe('order-123');
      }
    });
  });

  describe('updateWorkOrderState', () => {
    it('should update work order state', async () => {
      const mockOrder = {
        id: 'order-123',
        state: 'pendiente',
        crewId: null,
      };

      (prisma.workOrder.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.workOrder.update as jest.Mock).mockResolvedValue({
        ...mockOrder,
        state: 'asignada',
      });
      (prisma.workOrderEvent.create as jest.Mock).mockResolvedValue({});

      const result = await WorkOrderService.updateWorkOrderState('order-123', {
        state: 'asignada',
      });

      expect(result._tag).toBe('ok');
    });

    it('should return error for invalid state transition', async () => {
      const mockOrder = {
        id: 'order-123',
        state: 'visitada_finalizada', // Estado final
        crewId: null,
      };

      (prisma.workOrder.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      const result = await WorkOrderService.updateWorkOrderState('order-123', {
        state: 'pendiente',
      });

      expect(result._tag).toBe('error');
    });
  });
});

