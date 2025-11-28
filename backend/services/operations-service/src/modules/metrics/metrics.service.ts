import { Result , Logger } from '@aaron/common';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@aaron/prisma-client-ops';

import { prisma } from '../../config/database';
const logger = new Logger('MetricsService');

@Injectable()
export class MetricsService {
  async getOverview() {
    try {
      // Orders by state
      const ordersByState = await prisma.workOrder.groupBy({
        by: ['state'],
        _count: {
          id: true,
        },
      });

      // Average duration (for completed orders)
      const completedOrders = await prisma.workOrder.findMany({
        where: {
          state: 'FINALIZADA',
          startedAt: { not: null },
          completedAt: { not: null },
        },
        select: {
          startedAt: true,
          completedAt: true,
        },
      });

      const durations = completedOrders
        .map((order) => {
          if (!order.startedAt || !order.completedAt) return null;
          return order.completedAt.getTime() - order.startedAt.getTime();
        })
        .filter((d): d is number => d !== null);

      const avgDurationMs = durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;
      const avgDurationHours = avgDurationMs / (1000 * 60 * 60);

      // Crews utilization
      const crews = await prisma.crew.findMany({
        include: {
          _count: {
            select: { workOrders: true },
          },
        },
      });

      const totalCrews = crews.length;
      const busyCrews = crews.filter(
        (c) => c.state !== 'desocupado'
      ).length;
      const utilizationPercent = totalCrews > 0 ? (busyCrews / totalCrews) * 100 : 0;

      const overview = {
        ordersByState: ordersByState.map((item) => ({
          state: item.state,
          count: item._count.id,
        })),
        averageDurationHours: Math.round(avgDurationHours * 100) / 100,
        crewsUtilization: {
          total: totalCrews,
          busy: busyCrews,
          available: totalCrews - busyCrews,
          utilizationPercent: Math.round(utilizationPercent * 100) / 100,
        },
      };

      return Result.ok(overview);
    } catch (error) {
      logger.error('Get metrics overview error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to get metrics overview'));
    }
  }

  /**
   * Get operator dashboard summary metrics
   */
  async getOperatorSummary(filters?: {
    from?: string;
    to?: string;
  }): Promise<Result<Error, unknown>> {
    try {
      // Helper para obtener inicio y fin del día de hoy
      const getTodayRange = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return { start: today, end: tomorrow };
      };

      const todayRange = getTodayRange();
      const where: any = {};

      // Date range filter (si se proporciona)
      if (filters?.from || filters?.to) {
        where.createdAt = {};
        if (filters.from) where.createdAt.gte = new Date(filters.from);
        if (filters.to) where.createdAt.lte = new Date(filters.to);
      }

      // 1. RECLAMOS TOTALES: Total de work orders (sin filtro de fecha por defecto)
      const reclamosTotales = await prisma.workOrder.count(where.createdAt ? { where } : { where: {} });

      // 2. INCIDENTES HOY: Órdenes creadas HOY (filtro específico para hoy)
      const incidentesHoy = await prisma.workOrder.count({
        where: {
          createdAt: {
            gte: todayRange.start,
            lt: todayRange.end,
          },
        },
      });

      // 3. VISITAS HOY: Órdenes visitadas HOY (usando startedAt o completedAt de hoy)
      const visitasHoy = await prisma.workOrder.count({
        where: {
          OR: [
            {
              startedAt: {
                gte: todayRange.start,
                lt: todayRange.end,
              },
            },
            {
              completedAt: {
                gte: todayRange.start,
                lt: todayRange.end,
              },
            },
          ],
          state: {
            in: ['VISITADA_NO_FINALIZADA', 'VISITADA_FINALIZADA', 'EN_PROGRESO', 'FINALIZADA'],
          },
        },
      });

      // 4. ÓRDENES POR ESTADO: Contar órdenes agrupadas por estado
      const ordenesPorEstado = await prisma.workOrder.groupBy({
        by: ['state'],
        _count: true,
      });

      const estadoCounts = ordenesPorEstado.reduce((acc, item) => {
        acc[item.state] = item._count;
        return acc;
      }, {} as Record<string, number>);

      // 5. INCIDENTES DIARIOS: Para gráficos (últimos 7 días si no hay filtro)
      const daysToShow = filters?.from || filters?.to ? undefined : 7;
      const incidentesWhere: any = {};
      
      if (daysToShow) {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - daysToShow);
        daysAgo.setHours(0, 0, 0, 0);
        incidentesWhere.createdAt = { gte: daysAgo };
      } else if (filters?.from || filters?.to) {
        incidentesWhere.createdAt = {};
        if (filters.from) incidentesWhere.createdAt.gte = new Date(filters.from);
        if (filters.to) incidentesWhere.createdAt.lte = new Date(filters.to);
      }

      const orders = await prisma.workOrder.findMany({
        where: incidentesWhere,
        select: {
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      const incidentesDiarios = this.groupByDate(orders, 'createdAt');

      // 6. VISITAS DIARIAS: Para gráficos (últimos 7 días si no hay filtro)
      const visitasWhere: any = {
        ...incidentesWhere,
          state: {
            in: ['VISITADA_NO_FINALIZADA', 'VISITADA_FINALIZADA', 'EN_PROGRESO', 'FINALIZADA'],
        },
      };

      const visitedOrders = await prisma.workOrder.findMany({
        where: visitasWhere,
        select: {
          completedAt: true,
          startedAt: true,
        },
      });

      const visitasDiarias = this.groupByDate(
        visitedOrders.map(o => ({ createdAt: o.completedAt || o.startedAt || new Date() })),
        'createdAt'
      );

      return Result.ok({
        reclamosTotales,
        incidentesHoy, // Valor específico para HOY
        visitasHoy, // Valor específico para HOY
        ordenesPorEstado: estadoCounts,
        incidentesDiarios, // Array para gráficos
        visitasDiarias, // Array para gráficos
      });
    } catch (error) {
      logger.error('Get operator summary error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to get operator summary'));
    }
  }

  /**
   * Get orders by status series for charts
   */
  async getOrdersByStatusSeries(filters?: {
    from?: string;
    to?: string;
    groupBy?: 'day' | 'month' | 'year';
  }): Promise<Result<Error, unknown[]>> {
    try {
      const groupBy = filters?.groupBy || 'day';
      const where: any = {};

      // Date range filter
      if (filters?.from || filters?.to) {
        where.createdAt = {};
        if (filters.from) where.createdAt.gte = new Date(filters.from);
        if (filters.to) where.createdAt.lte = new Date(filters.to);
      }

      // Get all orders in range
      const orders = await prisma.workOrder.findMany({
        where,
        select: {
          createdAt: true,
          state: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      // Group by period and state
      const series = this.groupByPeriodAndState(orders, groupBy);

      return Result.ok(series);
    } catch (error) {
      logger.error('Get orders by status series error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to get orders by status series'));
    }
  }

  /**
   * Helper: Group data by date
   */
  private groupByDate(data: Array<{ createdAt: Date | null }>, field: string): Array<{ fecha: string; cantidad: number }> {
    const grouped = data.reduce((acc, item) => {
      const date = item.createdAt;
      if (!date) return acc;
      
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      acc[dateKey] = (acc[dateKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([fecha, cantidad]) => ({
      fecha,
      cantidad,
    }));
  }

  /**
   * Helper: Group by period and state
   */
  private groupByPeriodAndState(
    orders: Array<{ createdAt: Date; state: any }>,
    groupBy: 'day' | 'month' | 'year'
  ): Array<any> {
    const grouped: Record<string, Record<string, number>> = {};

    orders.forEach(order => {
      let periodKey: string;
      const date = new Date(order.createdAt);

      switch (groupBy) {
        case 'day':
          periodKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'month':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
          break;
        case 'year':
          periodKey = String(date.getFullYear()); // YYYY
          break;
        default:
          periodKey = date.toISOString().split('T')[0];
      }

      if (!grouped[periodKey]) {
        grouped[periodKey] = {
          PENDIENTE: 0,
          EN_PROGRESO: 0,
          FINALIZADA: 0,
          CANCELADA: 0,
        };
      }

      // Map states to simplified categories
      const stateCategory = this.mapStateToCategory(order.state);
      grouped[periodKey][stateCategory] = (grouped[periodKey][stateCategory] || 0) + 1;
    });

    return Object.entries(grouped).map(([periodo, states]) => ({
      periodo,
      pendiente: states.PENDIENTE || 0,
      en_curso: states.EN_PROGRESO || 0,
      finalizado: states.FINALIZADA || 0,
      cancelado: states.CANCELADA || 0,
    }));
  }

  /**
   * Helper: Map work order state to simplified category
   */
  private mapStateToCategory(state: string): string {
    switch (state) {
      case 'PENDIENTE':
      case 'ASIGNADA':
      case 'CONFIRMADA':
      case 'PROGRAMADA':
        return 'PENDIENTE';
      
      case 'EN_CAMINO':
      case 'VISITA':
      case 'VISITADA_NO_FINALIZADA':
      case 'COMENZADA':
      case 'EN_PROGRESO':
        return 'EN_PROGRESO';
      
      case 'VISITADA_FINALIZADA':
      case 'FINALIZADA':
        return 'FINALIZADA';
      
      case 'CANCELADA':
      case 'PAUSADA':
      case 'SUSPENDIDA':
        return 'CANCELADA';
      
      default:
        return 'PENDIENTE';
    }
  }
  /**
   * Admin: Global Summary
   */
  async getAdminSummary(filters: { from?: string; to?: string }): Promise<Result<Error, any>> {
    try {
      const where: any = {};
      if (filters.from || filters.to) {
        where.createdAt = {};
        if (filters.from) where.createdAt.gte = new Date(filters.from);
        if (filters.to) where.createdAt.lte = new Date(filters.to);
      }

      const [
        totalSubscribers,
        newSubscriptions,
        cancelledSubscriptions,
        payments
      ] = await Promise.all([
        prisma.subscription.count({ where: { status: 'ACTIVE' } }),
        prisma.subscription.count({ where: { ...where, status: 'ACTIVE' } }), // Altas en periodo (aprox)
        prisma.subscription.count({ where: { ...where, status: 'CANCELED' } }), // Bajas en periodo
        prisma.payment.aggregate({
          where: {
            ...where,
            status: 'POSTED',
          },
          _sum: { amount: true },
        }),
      ]);

      const revenue = payments._sum.amount ? Number(payments._sum.amount) : 0;
      
      // Calculate churn rate
      const startSubscribers = totalSubscribers - newSubscriptions + cancelledSubscriptions;
      const churnRate = startSubscribers > 0 ? cancelledSubscriptions / startSubscribers : 0;

      // Calculate overdue amount
      const overdueSubscriptions = await prisma.subscription.findMany({
        where: {
          status: { in: ['PAST_DUE', 'GRACE'] },
        },
        select: { montoMensual: true },
      });
      
      const overdueAmount = overdueSubscriptions.reduce((sum, sub) => sum + Number(sub.montoMensual || 0), 0);
      const totalExposure = revenue + overdueAmount;
      const lossRate = totalExposure > 0 ? overdueAmount / totalExposure : 0;

      return Result.ok({
        suscriptores_totales: totalSubscribers,
        altas_periodo: newSubscriptions,
        bajas_periodo: cancelledSubscriptions,
        tasa_churn: churnRate,
        ingresos_suscripciones_activas: revenue,
        monto_vencido: overdueAmount,
        monto_por_vencer_30d: 0, // TODO: Implement logic for future due dates
        porcentaje_perdidas_morosidad: lossRate,
      });
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Failed to get admin summary'));
    }
  }

  async getSubscriptionsByPlan(filters: { from?: string; to?: string }): Promise<Result<Error, any>> {
    try {
      const plans = await prisma.plan.findMany({
        include: {
          _count: {
            select: { subscriptions: true },
          },
        },
      });

      return Result.ok(plans.map(p => ({
        plan_id: p.id,
        plan_nombre: p.name,
        cantidad: p._count.subscriptions,
      })));
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Failed to get subscriptions by plan'));
    }
  }

  async getSubscriptionsTimeline(filters: { from?: string; to?: string; groupBy?: 'day' | 'month' }): Promise<Result<Error, any>> {
    try {
      // This is a simplified implementation. Ideally we'd query subscriptions created/cancelled in range.
      // For now returning empty array as placeholder or basic query
      const where: any = {};
      if (filters.from) where.createdAt = { gte: new Date(filters.from) };
      if (filters.to) where.createdAt = { ...where.createdAt, lte: new Date(filters.to) };

      const newSubs = await prisma.subscription.findMany({
        where,
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      });

      // Grouping logic similar to groupByDate
      const grouped = this.groupByDate(newSubs, 'createdAt');
      
      return Result.ok(grouped.map(g => ({
        periodo: g.fecha,
        altas: g.cantidad,
        bajas: 0, // TODO: Implement bajas query
      })));
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Failed to get timeline'));
    }
  }

  async getRecurringServices(filters: { from?: string; to?: string }): Promise<Result<Error, any>> {
    try {
      const where: any = {};
      if (filters.from || filters.to) {
        where.createdAt = {};
        if (filters.from) where.createdAt.gte = new Date(filters.from);
        if (filters.to) where.createdAt.lte = new Date(filters.to);
      }

      const services = await prisma.workOrder.groupBy({
        by: ['workTypeId'],
        where,
        _count: true,
      });

      // Need to fetch work type names
      const workTypes = await prisma.workType.findMany({
        where: { id: { in: services.map(s => s.workTypeId).filter((id): id is string => id !== null) } },
      });

      return Result.ok(services.map(s => {
        const wt = workTypes.find(w => w.id === s.workTypeId);
        return {
          work_type_id: s.workTypeId,
          nombre: wt?.nombre || 'Unknown',
          cantidad: s._count,
          descripcion: wt?.descripcion,
        };
      }));
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Failed to get recurring services'));
    }
  }

  async getOverdueSubscriptions(filters: { from?: string; to?: string }): Promise<Result<Error, any>> {
    try {
      const subs = await prisma.subscription.findMany({
        where: {
          status: { in: ['PAST_DUE', 'GRACE'] },
        },
        include: {
          client: true,
          plan: true,
          property: true,
        },
      });

      return Result.ok(subs.map(s => ({
        subscription_id: s.id,
        cliente: s.client?.nombreCompleto || s.client?.email,
        plan: s.plan.name,
        property_alias: s.property?.alias || s.property?.address,
        fecha_vencimiento: s.nextChargeAt,
        monto: s.montoMensual,
        dias_atraso: s.nextChargeAt ? Math.floor((Date.now() - s.nextChargeAt.getTime()) / (1000 * 60 * 60 * 24)) : 0,
      })));
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Failed to get overdue subscriptions'));
    }
  }
}
