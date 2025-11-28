/**
 * Unit tests for TrackingService
 */
import { prisma } from '../config/database';

import { TrackingService } from './tracking.service';

jest.mock('../config/database');

describe('TrackingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('savePing', () => {
    it('should save a location ping', async () => {
      const mockPing = {
        id: 'ping-123',
        crewId: 'crew-123',
        orderId: 'order-123',
        lat: -34.603722,
        lng: -58.381592,
        source: 'hourly_api',
        timestamp: new Date(),
      };

      (prisma.crewPing.create as jest.Mock).mockResolvedValue(mockPing);

      const result = await TrackingService.savePing({
        crewId: 'crew-123',
        orderId: 'order-123',
        lat: -34.603722,
        lng: -58.381592,
        source: 'hourly_api',
      });

      expect(result._tag).toBe('ok');
      if (result._tag === 'ok') {
        expect(result.value.id).toBe('ping-123');
      }
    });

    it('should return error for invalid coordinates', async () => {
      const result = await TrackingService.savePing({
        crewId: 'crew-123',
        lat: 200, // Invalid latitude
        lng: -58.381592,
        source: 'hourly_api',
      });

      expect(result._tag).toBe('error');
    });
  });

  describe('getRoute', () => {
    it('should return route between dates', async () => {
      const mockPings = [
        {
          id: 'ping-1',
          lat: -34.603722,
          lng: -58.381592,
          timestamp: new Date('2024-01-15T10:00:00Z'),
        },
        {
          id: 'ping-2',
          lat: -34.604722,
          lng: -58.382592,
          timestamp: new Date('2024-01-15T11:00:00Z'),
        },
      ];

      (prisma.crewPing.findMany as jest.Mock).mockResolvedValue(mockPings);

      const result = await TrackingService.getRoute({
        crewId: 'crew-123',
        from: new Date('2024-01-15T10:00:00Z'),
        to: new Date('2024-01-15T12:00:00Z'),
      });

      expect(result._tag).toBe('ok');
      if (result._tag === 'ok') {
        expect(result.value.pings.length).toBe(2);
      }
    });
  });
});

