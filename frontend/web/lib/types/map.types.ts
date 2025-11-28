/**
 * Tipos para el mapa
 * Domain layer - Definiciones de tipos para marcadores del mapa
 */

export enum MarkerType {
  CLIENT = 'client', // Cliente con órdenes o reclamos
  OPERATOR = 'operator', // Operario con app en funcionamiento
  ORDER = 'order', // Orden de cliente
  CREW = 'crew', // Cuadrilla o equipo
}

export interface BaseMarker {
  id: string;
  type: MarkerType;
  position: {
    lat: number;
    lng: number;
  };
  title: string;
  description?: string;
  // Optional visual customization shared by marker variants
  color?: string;
  icon?: string;
  isCircle?: boolean;
}

/**
 * Marcador de Cliente
 * Representa un cliente con órdenes activas o reclamos pendientes
 */
export interface ClientMarker extends BaseMarker {
  type: MarkerType.CLIENT;
  clientId: string;
  clientName: string;
  ordersCount?: number;
  claimsCount?: number;
  status: 'active' | 'pending' | 'resolved';
  // Datos para el futuro modal/detalle
  metadata?: {
    phone?: string;
    email?: string;
    address?: string;
    lastOrderDate?: string;
  };
}

/**
 * Marcador de Operario
 * Representa un operario con la app en funcionamiento
 */
export interface OperatorMarker extends BaseMarker {
  type: MarkerType.OPERATOR;
  operatorId: string;
  operatorName: string;
  status: 'available' | 'busy' | 'offline';
  currentOrderId?: string;
  // Datos para el futuro modal/detalle
  metadata?: {
    phone?: string;
    vehicle?: string;
    lastUpdate?: string;
    ordersCompleted?: number;
  };
}

/**
 * Marcador de Orden
 * Representa una orden de cliente mostrada como círculo en el mapa
 */
export interface OrderMarker extends BaseMarker {
  type: MarkerType.ORDER;
  // Additional visual properties for order markers
  color: string; // color based on order state
  isCircle: boolean; // always true for order markers
  // Optional extra info
  description?: string;
}

/**
 * Marcador de Cuadrilla
 * Representa una cuadrilla (crew) mostrada como punto en el mapa
 */
export interface CrewMarker extends BaseMarker {
  type: MarkerType.CREW;
  // Visual properties for crew markers
  color: string; // color based on availability
  icon?: string; // optional icon name
  // Optional extra info
  description?: string;
}

export type MapMarker = ClientMarker | OperatorMarker | OrderMarker | CrewMarker;

/**
 * Configuración del mapa
 */
export interface MapConfig {
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
}

/**
 * Estado del mapa
 */
export interface MapState {
  selectedMarker: MapMarker | null;
  visibleMarkers: MarkerType[]; // Filtros para mostrar/ocultar tipos
}


