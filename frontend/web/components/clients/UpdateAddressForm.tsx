'use client';

import React, { useState } from 'react';
import { opsApi } from '@/lib/api/services';

interface UpdateAddressFormProps {
  clientId: string;
  currentAddress?: {
    calle?: string;
    numero?: string;
    piso?: string;
    departamento?: string;
    localidad?: string;
    provincia?: string;
    codigoPostal?: string;
  };
  onSuccess?: () => void;
}

export const UpdateAddressForm: React.FC<UpdateAddressFormProps> = ({
  clientId,
  currentAddress,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    calle: currentAddress?.calle || '',
    numero: currentAddress?.numero || '',
    piso: currentAddress?.piso || '',
    departamento: currentAddress?.departamento || '',
    localidad: currentAddress?.localidad || '',
    provincia: currentAddress?.provincia || '',
    codigoPostal: currentAddress?.codigoPostal || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await opsApi.patch(`/clients/${clientId}`, formData);
      
      if (result.success) {
        setSuccess(true);
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } else {
        setError(result.error || 'Error al actualizar el domicilio');
      }
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el domicilio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg">
          Domicilio actualizado correctamente
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Calle
          </label>
          <input
            type="text"
            value={formData.calle}
            onChange={(e) => setFormData({ ...formData, calle: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número
          </label>
          <input
            type="text"
            value={formData.numero}
            onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Piso
          </label>
          <input
            type="text"
            value={formData.piso}
            onChange={(e) => setFormData({ ...formData, piso: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Departamento
          </label>
          <input
            type="text"
            value={formData.departamento}
            onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Localidad
          </label>
          <input
            type="text"
            value={formData.localidad}
            onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Provincia
          </label>
          <input
            type="text"
            value={formData.provincia}
            onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código Postal
          </label>
          <input
            type="text"
            value={formData.codigoPostal}
            onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  );
};


