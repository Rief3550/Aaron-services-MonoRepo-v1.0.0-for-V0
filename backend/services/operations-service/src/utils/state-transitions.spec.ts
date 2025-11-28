import {
  isValidWorkOrderTransition,
  isValidCrewTransition,
  isWorkOrderFinalState,
  WorkOrderState,
  CrewState,
} from './state-transitions';

describe('State Transitions', () => {
  describe('WorkOrder transitions', () => {
    it('should allow valid transitions', () => {
      expect(isValidWorkOrderTransition('pendiente', 'asignada').valid).toBe(true);
      expect(isValidWorkOrderTransition('asignada', 'confirmada').valid).toBe(true);
      expect(isValidWorkOrderTransition('confirmada', 'en_camino').valid).toBe(true);
      expect(isValidWorkOrderTransition('en_camino', 'visitada_no_finalizada').valid).toBe(true);
      expect(isValidWorkOrderTransition('visitada_no_finalizada', 'visitada_finalizada').valid).toBe(true);
    });

    it('should reject invalid transitions', () => {
      expect(isValidWorkOrderTransition('pendiente', 'en_camino').valid).toBe(false);
      expect(isValidWorkOrderTransition('asignada', 'visitada_finalizada').valid).toBe(false);
      expect(isValidWorkOrderTransition('visitada_finalizada', 'pendiente').valid).toBe(false);
    });

    it('should allow same state (for metadata updates)', () => {
      expect(isValidWorkOrderTransition('pendiente', 'pendiente').valid).toBe(true);
      expect(isValidWorkOrderTransition('en_camino', 'en_camino').valid).toBe(true);
    });

    it('should identify final states', () => {
      expect(isWorkOrderFinalState('visitada_finalizada')).toBe(true);
      expect(isWorkOrderFinalState('cancelada')).toBe(true);
      expect(isWorkOrderFinalState('pendiente')).toBe(false);
      expect(isWorkOrderFinalState('en_camino')).toBe(false);
    });
  });

  describe('Crew transitions', () => {
    it('should allow valid transitions', () => {
      expect(isValidCrewTransition('desocupado', 'en_camino').valid).toBe(true);
      expect(isValidCrewTransition('desocupado', 'en_trabajo').valid).toBe(true);
      expect(isValidCrewTransition('en_camino', 'en_trabajo').valid).toBe(true);
      expect(isValidCrewTransition('en_camino', 'desocupado').valid).toBe(true);
      expect(isValidCrewTransition('en_trabajo', 'en_progreso').valid).toBe(true);
      expect(isValidCrewTransition('en_trabajo', 'desocupado').valid).toBe(true);
    });

    it('should reject invalid transitions', () => {
      expect(isValidCrewTransition('desocupado', 'en_progreso').valid).toBe(false);
      expect(isValidCrewTransition('en_progreso', 'en_camino').valid).toBe(false);
    });

    it('should allow same state (for progress updates)', () => {
      expect(isValidCrewTransition('desocupado', 'desocupado').valid).toBe(true);
      expect(isValidCrewTransition('en_progreso', 'en_progreso').valid).toBe(true);
    });
  });
});

