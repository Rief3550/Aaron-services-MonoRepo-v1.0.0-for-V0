import { Result , Logger } from '@aaron/common';
import { Injectable } from '@nestjs/common';

import { prisma } from '../../config/database';

import { RouteQueryDto } from './dto/route-query.dto';
import { RouteSummaryQueryDto } from './dto/route-summary-query.dto';
const logger = new Logger('RoutesService');

@Injectable()
export class RoutesService {
  async getRoute(query: RouteQueryDto) {
    try {
      const fromDate = query.from ? new Date(query.from) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24h
      const toDate = query.to ? new Date(query.to) : new Date();

      // Get pings
      const pings = await prisma.crewPing.findMany({
        where: {
          crewId: query.crewId,
          ...(query.orderId && { orderId: query.orderId }),
          at: {
            gte: fromDate,
            lte: toDate,
          },
        },
        orderBy: { at: 'asc' },
      });

      // Calculate distance (simple haversine)
      let totalDistanceKm = 0;
      for (let i = 1; i < pings.length; i++) {
        const prev = pings[i - 1];
        const curr = pings[i];
        const distance = this.haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
        totalDistanceKm += distance;
      }

      if (pings.length > 0) {
        await this.persistRouteSummary({
          crewId: query.crewId,
          orderId: query.orderId,
          from: fromDate,
          to: toDate,
          distanceKm: totalDistanceKm,
          pingCount: pings.length,
        });
      }

      return Result.ok({
        crewId: query.crewId,
        orderId: query.orderId,
        from: fromDate,
        to: toDate,
        pings,
        totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
        pingCount: pings.length,
      });
    } catch (error) {
      logger.error('Get route error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to get route'));
    }
  }

  async listSummaries(query: RouteSummaryQueryDto) {
    try {
      const where: Record<string, any> = {};

      if (query.crewId) {
        where.crewId = query.crewId;
      }

      if (query.orderId) {
        where.orderId = query.orderId;
      }

      if (query.from || query.to) {
        where.from = {};
        if (query.from) {
          where.from.gte = new Date(query.from);
        }
        if (query.to) {
          where.from.lte = new Date(query.to);
        }
      }

      const summaries = await prisma.routeSummary.findMany({
        where,
        orderBy: { from: 'desc' },
        take: query.limit ?? 50,
      });

      return Result.ok({
        summaries,
      });
    } catch (error) {
      logger.error('List route summaries error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to list summaries'));
    }
  }

  private async persistRouteSummary(params: {
    crewId: string;
    orderId?: string;
    from: Date;
    to: Date;
    distanceKm: number;
    pingCount: number;
  }) {
    const { crewId, orderId, from, to, distanceKm, pingCount } = params;
    const bucketStart = new Date(from);
    bucketStart.setHours(0, 0, 0, 0);

    await prisma.routeSummary.upsert({
      where: {
        crewId_orderId_from: {
          crewId,
          orderId: orderId ?? null,
          from: bucketStart,
        },
      },
      update: {
        to,
        distanceKm,
        meta: {
          pingCount,
          lastUpdatedAt: new Date().toISOString(),
        },
      },
      create: {
        crewId,
        orderId,
        from: bucketStart,
        to,
        distanceKm,
        meta: {
          pingCount,
        },
      },
    });
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
