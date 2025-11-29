'use client';

import React, { useState } from 'react';
import { opsApi } from '@/lib/api/services';

interface StatusModalProps {
    orderId: string;
    currentState: string;
    onClose: () => void;
    onUpdated: () => void;
}

// Simplified mapping of allowed transitions (in real app this would be dynamic)
const allowedTransitions: Record<string, string[]> = {
    PENDIENTE: ['ASIGNADA', 'CANCELADA'],
    ASIGNADA: ['EN_CAMINO', 'CANCELADA'],
    EN_CAMINO: ['EN_PROGRESO', 'CANCELADA'],
    EN_PROGRESO: ['FINALIZADA', 'CANCELADA'],
    FINALIZADA: [],
    CANCELADA: [],
};

export const StatusModal: React.FC<StatusModalProps> = ({ orderId, currentState, onClose, onUpdated }) => {
    const [newState, setNewState] = useState<string>('');
    const [motivo, setMotivo] = useState<string>('');
    const [costoFinal, setCostoFinal] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const possible = allowedTransitions[currentState] || [];

    const handleSubmit = async () => {
        if (!newState) return;
        setLoading(true);
        try {
            const payload: any = { state: newState, motivo };
            if (newState === 'FINALIZADA' && costoFinal) {
                payload.costoFinal = Number(costoFinal);
            }
            await opsApi.patch(`/work-orders/${orderId}/status`, payload);
            onUpdated();
            onClose();
        } catch (e) {
            console.error('Error updating status', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
            <div className="bg-white rounded-lg p-6 w-96">
                <h2 className="text-lg font-medium mb-4">Cambiar estado</h2>
                <select
                    className="w-full mb-3 border rounded p-2"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                >
                    <option value="">Seleccionar nuevo estado</option>
                    {possible.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
                <textarea
                    className="w-full mb-3 border rounded p-2"
                    placeholder="Motivo (opcional)"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                />
                {newState === 'FINALIZADA' && (
                    <input
                        type="number"
                        className="w-full mb-3 border rounded p-2"
                        placeholder="Costo final"
                        value={costoFinal}
                        onChange={(e) => setCostoFinal(e.target.value)}
                    />
                )}
                <div className="flex justify-end space-x-2">
                    <button
                        className="px-4 py-2 bg-gray-200 rounded"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                        onClick={handleSubmit}
                        disabled={loading || !newState}
                    >
                        {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
};
