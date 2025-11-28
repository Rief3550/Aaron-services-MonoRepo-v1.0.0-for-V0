/**
 * Validación de transiciones de estados
 * Define qué transiciones son válidas para órdenes y cuadrillas
 */
import { WorkOrderState } from '@aaron/prisma-client-ops';

export { WorkOrderState };

export type CrewState = 'desocupado' | 'en_camino' | 'en_trabajo' | 'en_progreso';

/**
 * Mapa de transiciones válidas para órdenes de trabajo
 * Key: estado actual, Value: estados permitidos
 * 
 * FLUJO PRINCIPAL SIMPLIFICADO (para frontend):
 * PENDIENTE → ASIGNADA → EN_PROGRESO → FINALIZADA
 *                    ↘ CANCELADA
 * 
 * FLUJO DETALLADO (uso interno de operadores):
 * PENDIENTE → ASIGNADA → CONFIRMADA → EN_CAMINO → PROGRAMADA → VISITA → 
 * COMENZADA → EN_PROGRESO → FINALIZADA
 */
const WORK_ORDER_TRANSITIONS: Record<WorkOrderState, WorkOrderState[]> = {
  // Estado inicial: puede asignarse o cancelarse
  PENDIENTE: ['ASIGNADA', 'PROGRAMADA', 'CANCELADA'],
  
  // Asignada a cuadrilla: puede avanzar en el flujo o cancelarse
  ASIGNADA: ['CONFIRMADA', 'EN_CAMINO', 'PROGRAMADA', 'EN_PROGRESO', 'CANCELADA', 'PENDIENTE'],
  
  // Cuadrilla confirmó: puede ir en camino o programarse
  CONFIRMADA: ['EN_CAMINO', 'PROGRAMADA', 'CANCELADA', 'ASIGNADA'],
  
  // En camino al domicilio
  EN_CAMINO: ['VISITA', 'PROGRAMADA', 'CANCELADA', 'ASIGNADA'],
  
  // Programada para fecha específica
  PROGRAMADA: ['ASIGNADA', 'VISITA', 'COMENZADA', 'EN_PROGRESO', 'PAUSADA', 'CANCELADA'],
  
  // En el domicilio realizando visita
  VISITA: ['VISITADA_NO_FINALIZADA', 'VISITADA_FINALIZADA', 'COMENZADA', 'EN_PROGRESO', 'PAUSADA', 'CANCELADA'],
  
  // Visitada pero requiere otra visita
  VISITADA_NO_FINALIZADA: ['PROGRAMADA', 'COMENZADA', 'CANCELADA'],
  
  // Visitada y lista para finalizar
  VISITADA_FINALIZADA: ['FINALIZADA'],
  
  // Trabajo comenzado
  COMENZADA: ['EN_PROGRESO', 'PAUSADA', 'CANCELADA'],
  
  // Trabajo en curso (puede finalizar, pausar o cancelar)
  EN_PROGRESO: ['FINALIZADA', 'PAUSADA', 'SUSPENDIDA', 'CANCELADA'],
  
  // ESTADOS FINALES (INMUTABLES)
  FINALIZADA: [], // No se puede cambiar - transparencia y trazabilidad
  CANCELADA: [],  // No se puede cambiar - transparencia y trazabilidad
  
  // Estados de pausa
  PAUSADA: ['PROGRAMADA', 'COMENZADA', 'EN_PROGRESO', 'ASIGNADA', 'CANCELADA'],
  SUSPENDIDA: ['PROGRAMADA', 'COMENZADA', 'ASIGNADA', 'CANCELADA'],
};

/**
 * Mapa de transiciones válidas para cuadrillas
 */
const CREW_TRANSITIONS: Record<CrewState, CrewState[]> = {
  desocupado: ['en_camino', 'en_trabajo'],
  en_camino: ['en_trabajo', 'desocupado'],
  en_trabajo: ['en_progreso', 'desocupado'],
  en_progreso: ['en_trabajo', 'desocupado'], // en_progreso es un estado con progress%
};

/**
 * Valida si una transición de estado de orden es válida
 */
export function isValidWorkOrderTransition(
  from: WorkOrderState,
  to: WorkOrderState
): { valid: boolean; reason?: string } {
  // Mismo estado (solo para actualizar metadata)
  if (from === to) {
    return { valid: true };
  }

  const allowed = WORK_ORDER_TRANSITIONS[from] || [];

  if (!allowed.includes(to)) {
    return {
      valid: false,
      reason: `Invalid transition: ${from} -> ${to}. Allowed: ${allowed.join(', ') || 'none'}`,
    };
  }

  return { valid: true };
}

/**
 * Valida si una transición de estado de cuadrilla es válida
 */
export function isValidCrewTransition(
  from: CrewState,
  to: CrewState
): { valid: boolean; reason?: string } {
  // Mismo estado (para actualizar progress u otros campos)
  if (from === to) {
    return { valid: true };
  }

  const allowed = CREW_TRANSITIONS[from] || [];

  if (!allowed.includes(to)) {
    return {
      valid: false,
      reason: `Invalid transition: ${from} -> ${to}. Allowed: ${allowed.join(', ') || 'none'}`,
    };
  }

  return { valid: true };
}

/**
 * Obtiene el flujo principal de estados para órdenes
 */
export function getWorkOrderMainFlow(): WorkOrderState[] {
  return ['PENDIENTE', 'ASIGNADA', 'CONFIRMADA', 'EN_CAMINO', 'PROGRAMADA', 'VISITA', 'VISITADA_FINALIZADA', 'COMENZADA', 'EN_PROGRESO', 'FINALIZADA'];
}

/**
 * Obtiene estados finales (no se pueden cambiar)
 */
export function getWorkOrderFinalStates(): WorkOrderState[] {
  return ['FINALIZADA', 'CANCELADA'];
}

/**
 * Verifica si un estado es final
 */
export function isWorkOrderFinalState(state: WorkOrderState): boolean {
  return getWorkOrderFinalStates().includes(state);
}
