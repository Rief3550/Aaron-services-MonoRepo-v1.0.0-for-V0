/**
 * Tipos compartidos para órdenes de trabajo
 */

export interface WorkOrderResponse {
  id: string;
  customerId: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  type: string;
  description: string;
  state: WorkOrderState;
  crewId?: string;
  progress?: number;
  createdAt: string;
  updatedAt: string;
}

export type WorkOrderState =
  | 'pendiente'
  | 'asignada'
  | 'confirmada'
  | 'en_camino'
  | 'visitada_no_finalizada'
  | 'visitada_finalizada'
  | 'pausada'
  | 'cancelada'
  | 'suspendida';

