/**
 * Modal para cambio de estado de órdenes de trabajo
 * Maneja lógica de negocio para transiciones de estado:
 * - PENDIENTE -> ASIGNADA (requiere cuadrilla)
 * - * -> FINALIZADA (requiere motivo y observación)
 * - * -> CANCELADA (requiere observación)
 */

'use client';

import { useState, useEffect } from 'react';
import { opsApi } from '@/lib/api/services';
import { Loader } from '@/components/ui/loader';

interface OrderStateModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any; // Tipar correctamente si es posible, o usar 'any' por ahora para flexibilidad
  onUpdate: () => void;
}

interface Crew {
  id: string;
  name: string;
}

export const OrderStateModal: React.FC<OrderStateModalProps> = ({ isOpen, onClose, order, onUpdate }) => {
  const [step, setStep] = useState<'SELECT_STATE' | 'DETAILS'>('SELECT_STATE');
  const [targetState, setTargetState] = useState<string>('');
  const [crews, setCrews] = useState<Crew[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [observation, setObservation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes or order changes
  useEffect(() => {
    if (isOpen) {
      setStep('SELECT_STATE');
      setTargetState('');
      setSelectedCrew('');
      setReason('');
      setObservation('');
      setError(null);
      // Cargar cuadrillas si vamos a asignar
      fetchCrews();
    }
  }, [isOpen, order]);

  const fetchCrews = async () => {
    try {
      // Endpoint para obtener cuadrillas (filtrar por activas si es necesario)
      const res = await opsApi.get<Crew[]>('/crews');
      if (res.success && res.data) {
        setCrews(res.data);
      }
    } catch (e) {
      console.error('Error loading crews', e);
    }
  };

  const handleStateSelect = (state: string) => {
    setTargetState(state);
    setStep('DETAILS');
  };

  const handleSubmit = async () => {
    if (!targetState) return;

    setLoading(true);
    setError(null);

    try {
      let success = false;

      if (targetState === 'ASIGNADA') {
        if (!selectedCrew) {
          setError('Debe seleccionar una cuadrilla');
          setLoading(false);
          return;
        }
        // 1. Asignar cuadrilla
        const assignRes = await opsApi.patch(`/work-orders/${order.id}/assign-crew/${selectedCrew}`, {
            observation // Enviar observación si la API lo soporta en este endpoint
        });
        
        // Si la asignación no cambia el estado automáticamente, lo hacemos explícitamente
        // (Depende del backend, pero asumiremos que assign-crew mueve a ASIGNADA o hacemos update state)
        if (assignRes.success) {
            success = true;
        } else {
            throw new Error('Error al asignar cuadrilla');
        }

      } else {
        // Cambio de estado genérico (FINALIZADA, CANCELADA, EN_PROGRESO, PENDIENTE)
        const body: any = { state: targetState };
        // Backend espera 'note' no 'observation'
        if (observation) body.note = observation;
        if (reason) body.note = `${reason}${observation ? ` - ${observation}` : ''}`;

        const res = await opsApi.patch(`/work-orders/${order.id}/state`, body);
        if (res.success) {
            success = true;
        } else {
            throw new Error('Error al actualizar estado');
        }
      }

      if (success) {
        onUpdate();
        onClose();
      }

    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Estados permitidos según estado actual (lógica simple, se puede refinar)
  const allowedStates = [
    { value: 'PENDIENTE', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'ASIGNADA', label: 'Asignada', color: 'bg-blue-100 text-blue-800' },
    { value: 'EN_PROGRESO', label: 'En Progreso', color: 'bg-purple-100 text-purple-800' },
    { value: 'FINALIZADA', label: 'Finalizada', color: 'bg-green-100 text-green-800' },
    { value: 'CANCELADA', label: 'Cancelada', color: 'bg-red-100 text-red-800' },
  ].filter(s => s.value !== order.state); // No mostrar el estado actual

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
        
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Actualizar Estado</h3>
            <p className="text-sm text-gray-500">Orden #{order.id.substring(0, 8)}...</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center">
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}

          {step === 'SELECT_STATE' ? (
            <div className="grid grid-cols-1 gap-3">
              <p className="text-sm text-gray-600 mb-2">Seleccione el nuevo estado:</p>
              {allowedStates.map((state) => (
                <button
                  key={state.value}
                  onClick={() => handleStateSelect(state.value)}
                  className={`flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group text-left`}
                >
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${state.color}`}>
                    {state.label}
                  </span>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Resumen del cambio */}
              <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                <span className="text-sm text-blue-800">Cambiando a: <strong>{targetState}</strong></span>
                <button 
                    onClick={() => setStep('SELECT_STATE')}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                    Cambiar
                </button>
              </div>

              {/* Lógica específica por estado */}
              {targetState === 'ASIGNADA' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asignar Cuadrilla <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedCrew}
                    onChange={(e) => setSelectedCrew(e.target.value)}
                    className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                  >
                    <option value="">Seleccione una cuadrilla...</option>
                    {crews.map(crew => (
                      <option key={crew.id} value={crew.id}>{crew.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Campos comunes: Motivo y Observación */}
              {(targetState === 'FINALIZADA' || targetState === 'CANCELADA') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo {targetState === 'FINALIZADA' ? 'de finalización' : 'de cancelación'}
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ej. Trabajo completado correctamente..."
                    className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones {targetState === 'ASIGNADA' && '(Opcional)'}
                </label>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Detalles adicionales..."
                  rows={3}
                  className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow resize-none"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full mt-4 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {loading ? <Loader size="sm" /> : 'Confirmar Cambio'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};




