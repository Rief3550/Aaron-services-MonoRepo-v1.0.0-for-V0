import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { createWorkOrder, CreateWorkOrderRequestDto } from '@/lib/work-orders/api';
import { fetchClients, Client } from '@/lib/clients/api';
import { fetchWorkTypes, WorkType } from '@/lib/work-types/api';
import { opsApi } from '@/lib/api/services';
import { GoogleMap } from '@/components/map/google-map';
import { MapMouseEvent } from '@vis.gl/react-google-maps';

interface CreateWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Property {
  id: string;
  address: string;
  lat: number;
  lng: number;
  status: string;
}

export function CreateWorkOrderModal({ isOpen, onClose, onSuccess }: CreateWorkOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [formData, setFormData] = useState<CreateWorkOrderRequestDto>({
    customerId: '',
    propertyId: '',
    workTypeId: '',
    serviceCategory: 'plomería',
    situacion: '',
    peligroAccidente: 'NO',
    observaciones: '',
    prioridad: 'MEDIA',
    canal: 'WEB',
    cantidadEstimada: undefined,
    unidadCantidad: '',
  });
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [customLocation, setCustomLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      // Reset form
      setFormData({
        customerId: '',
        propertyId: '',
        workTypeId: '',
        serviceCategory: 'plomería',
        situacion: '',
        peligroAccidente: 'NO',
        observaciones: '',
        prioridad: 'MEDIA',
        canal: 'WEB',
        cantidadEstimada: undefined,
        unidadCantidad: '',
      });
      setSelectedClient(null);
      setSelectedProperty(null);
      setProperties([]);
      setCustomLocation(null);
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      const [clientsData, workTypesData] = await Promise.all([
        fetchClients(),
        fetchWorkTypes(true),
      ]);
      setClients(clientsData);
      setWorkTypes(workTypesData);
    } catch (error) {
      console.error('Error loading initial data:', error);
      alert('Error al cargar datos. Intente nuevamente.');
    }
  };

  const handleClientChange = async (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    setSelectedClient(client || null);
    setFormData(prev => ({ ...prev, customerId: clientId, propertyId: '' }));
    setSelectedProperty(null);
    setProperties([]);

    if (clientId) {
      try {
        // Obtener propiedades del cliente
        const result = await opsApi.get<Property[]>(`/properties?clientId=${clientId}`);
        if (result.success && result.data) {
          const props = Array.isArray(result.data) ? result.data : [];
          setProperties(props);
          // Si hay una propiedad activa, seleccionarla por defecto
          const activeProp = props.find(p => p.status === 'ACTIVE');
          if (activeProp) {
            setSelectedProperty(activeProp);
            setFormData(prev => ({ ...prev, propertyId: activeProp.id }));
          }
        }
      } catch (error) {
        console.error('Error loading properties:', error);
      }
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    setSelectedProperty(property || null);
    setFormData(prev => ({ ...prev, propertyId }));
    if (property) {
      setCustomLocation({ lat: property.lat, lng: property.lng });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cantidadEstimada' ? (value ? Number(value) : undefined) : value
    }));
  };

  const handleMapClick = (e: MapMouseEvent) => {
    if (e.detail.latLng) {
      const lat = e.detail.latLng.lat;
      const lng = e.detail.latLng.lng;
      setCustomLocation({ lat, lng });
    }
  };

  const handleSubmit = async () => {
    if (!formData.customerId || !formData.serviceCategory || !formData.situacion) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      setLoading(true);
      await createWorkOrder(formData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating work order:', error);
      alert('Error al crear la orden. Verifique los datos.');
    } finally {
      setLoading(false);
    }
  };

  const serviceCategories = [
    'plomería',
    'electricidad',
    'gas',
    'pintura',
    'mampostería',
    'carpintería',
    'cerrajería',
    'emergencia',
    'otro'
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Orden de Trabajo" size="2xl">
      <div className="p-6 space-y-6">
        {/* Cliente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cliente <span className="text-red-500">*</span>
          </label>
          <select
            name="customerId"
            value={formData.customerId}
            onChange={(e) => handleClientChange(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Seleccionar cliente...</option>
            {clients
              .filter(c => c.estado === 'ACTIVO')
              .map(client => (
                <option key={client.id} value={client.userId}>
                  {client.nombreCompleto || client.razonSocial || client.email}
                </option>
              ))}
          </select>
        </div>

        {/* Propiedad */}
        {selectedClient && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Propiedad
            </label>
            <select
              name="propertyId"
              value={formData.propertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Seleccionar propiedad...</option>
              {properties.map(prop => (
                <option key={prop.id} value={prop.id}>
                  {prop.address} {prop.status === 'ACTIVE' ? '(Activa)' : ''}
                </option>
              ))}
            </select>
            {properties.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">Este cliente no tiene propiedades registradas</p>
            )}
          </div>
        )}

        {/* Tipo de Trabajo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Trabajo
          </label>
          <select
            name="workTypeId"
            value={formData.workTypeId}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Seleccionar tipo...</option>
            {workTypes.map(wt => (
              <option key={wt.id} value={wt.id}>
                {wt.nombre} {wt.descripcion ? `- ${wt.descripcion}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Categoría de Servicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría <span className="text-red-500">*</span>
            </label>
            <select
              name="serviceCategory"
              value={formData.serviceCategory}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              {serviceCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prioridad
            </label>
            <select
              name="prioridad"
              value={formData.prioridad}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
              <option value="EMERGENCIA">Emergencia</option>
            </select>
          </div>
        </div>

        {/* Situación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Situación / Descripción del Problema <span className="text-red-500">*</span>
          </label>
          <textarea
            name="situacion"
            value={formData.situacion}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Describa la situación actual del problema..."
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Peligro de Accidente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ¿Hay Peligro de Accidente?
            </label>
            <select
              name="peligroAccidente"
              value={formData.peligroAccidente}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="NO">No</option>
              <option value="SI">Sí</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>

          {/* Canal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Canal
            </label>
            <select
              name="canal"
              value={formData.canal}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="WEB">Web</option>
              <option value="TELEFONO">Teléfono</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="APP">App</option>
            </select>
          </div>
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observaciones Adicionales
          </label>
          <textarea
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Observaciones adicionales..."
          />
        </div>

        {/* Mapa (opcional, si no hay propiedad seleccionada) */}
        {!selectedProperty && customLocation && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ubicación (Click en el mapa para seleccionar)
            </label>
            <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300 relative">
              <GoogleMap
                center={customLocation}
                zoom={14}
                onMapClick={handleMapClick}
              />
              <div className="absolute top-2 left-2 bg-white px-2 py-1 rounded shadow text-xs font-bold">
                Click para ubicar: {customLocation.lat.toFixed(4)}, {customLocation.lng.toFixed(4)}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.customerId || !formData.serviceCategory || !formData.situacion}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Crear Orden
          </button>
        </div>
      </div>
    </Modal>
  );
}

