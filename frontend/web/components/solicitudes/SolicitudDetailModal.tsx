import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ContractForm } from './ContractForm';
import { opsApi } from '@/lib/api/services';
import { approveClient, type ApproveClientDto } from '@/lib/clients/api';
import type { Client } from '@/lib/clients/api';
import type { Plan } from '@/lib/plans/types';
import type { Subscription } from '@/lib/subscriptions/types';

type Tab = 'general' | 'auditoria' | 'contrato';

interface Property {
  id: string;
  tipoPropiedad?: string;
  tipoConstruccion?: string;
  metrosCuadrados?: number;
  cantidadBanos?: number;
  address?: string;
  ciudad?: string;
  provincia?: string;
  barrio?: string;
  ambientes?: string | number;
  banos?: string | number;
  superficieCubiertaM2?: string | number;
  superficieDescubiertaM2?: string | number;
  summary?: string;
  lat?: string | number;
  lng?: string | number;
  [key: string]: unknown;
}

interface SolicitudData {
  id: string;
  type?: string;
  description?: string;
  createdAt?: string;
  address?: string;
  email?: string;
  phone?: string;
  documento?: string;
  client?: Client & { subscriptions?: Subscription[]; properties?: Property[] };
  properties?: Property[];
  estadoCliente?: string;
  contract?: {
    planDetails?: Record<string, unknown>;
    [key: string]: unknown;
  };
  auditor?: {
    checklist?: {
      electrical?: boolean;
      plumbing?: boolean;
      gas?: boolean;
      [key: string]: unknown;
    };
    notes?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface ClientFormData {
  nombreCompleto: string;
  razonSocial: string;
  email: string;
  telefono: string;
  telefonoAlt: string;
  documento: string;
  direccionFacturacion: string;
  provincia: string;
  ciudad: string;
  codigoPostal: string;
  estado: string;
}

interface SolicitudDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  solicitud: SolicitudData;
  onUpdateStatus: (id: string, newStatus: string) => void;
}

const PROPERTY_TYPE_OPTIONS = [
  { value: 'DEPARTAMENTO', label: 'Departamento' },
  { value: 'CASA', label: 'Casa' },
  { value: 'PH', label: 'PH' },
  { value: 'COUNTRY', label: 'Country' },
  { value: 'LOCAL', label: 'Local comercial' },
  { value: 'OTRO', label: 'Otro' },
];

const CONSTRUCTION_TYPE_OPTIONS = [
  { value: 'LOSA', label: 'Losa / Tradicional' },
  { value: 'CHAPA', label: 'Chapa' },
  { value: 'MIXTO', label: 'Mixto' },
  { value: 'OTRO', label: 'Otro' },
];

const sanitizeDocument = (value: string): string => value.replace(/[^0-9a-zA-Z-]/g, '').slice(0, 20);

const sanitizePhone = (value: string): string => {
  if (!value) return '';
  let cleaned = value.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = '+' + cleaned.slice(1).replace(/\+/g, '');
  } else {
    cleaned = cleaned.replace(/\+/g, '');
  }
  return cleaned.slice(0, 20);
};

const cleanPayload = (data: Record<string, unknown>) =>
  Object.entries(data).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});

const getActiveSubscription = (subscriptions?: Subscription[]) =>
  subscriptions?.find(
    (s) => s?.status === 'ACTIVE' || s?.status === 'REVISION'
  ) || null;

export const SolicitudDetailModal: React.FC<SolicitudDetailModalProps> = ({
  isOpen,
  onClose,
  solicitud,
  onUpdateStatus,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [propertyData, setPropertyData] = useState<Property | null>(
    solicitud?.client?.properties?.[0] || solicitud?.properties?.[0] || null
  );
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<Subscription | null>(
    getActiveSubscription(solicitud?.client?.subscriptions)
  );
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    getActiveSubscription(solicitud?.client?.subscriptions)?.planId || ''
  );
  const [formData, setFormData] = useState<SolicitudData>(solicitud);
  const [clientForm, setClientForm] = useState<ClientFormData>({
    nombreCompleto: '',
    razonSocial: '',
    email: '',
    telefono: '',
    telefonoAlt: '',
    documento: '',
    direccionFacturacion: '',
    provincia: '',
    ciudad: '',
    codigoPostal: '',
    estado: solicitud?.client?.estado || solicitud?.estadoCliente || 'PENDIENTE',
  });
  const [propertyForm, setPropertyForm] = useState({
    address: '',
    ciudad: '',
    provincia: '',
    barrio: '',
    tipoPropiedad: '',
    tipoConstruccion: '',
    ambientes: '',
    banos: '',
    superficieCubiertaM2: '',
    superficieDescubiertaM2: '',
    summary: '',
    lat: '',
    lng: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clientId = useMemo<string | undefined>((): string | undefined => {
    const id = solicitud?.client?.id || solicitud?.clientId;
    if (typeof id === 'string') {
      return id;
    }
    return undefined;
  }, [solicitud]);

  const propertyId = useMemo(
    () =>
      solicitud?.client?.properties?.[0]?.id ||
      solicitud?.properties?.[0]?.id ||
      propertyData?.id,
    [solicitud, propertyData]
  );

  useEffect(() => {
    if (solicitud) {
      setFormData(solicitud);
      setPropertyData(solicitud.client?.properties?.[0] || solicitud.properties?.[0] || null);
      const active = getActiveSubscription(solicitud.client?.subscriptions);
      setCurrentPlan(active);
      setSelectedPlanId(active?.planId || '');
      setClientForm((prev) => ({
        ...prev,
        nombreCompleto: solicitud.client?.nombreCompleto || '',
        razonSocial: solicitud.client?.razonSocial || '',
        email: String(solicitud.client?.email || solicitud.email || ''),
        telefono: String(
          solicitud.client?.telefono ||
          solicitud.client?.telefonoCelular ||
          solicitud.phone ||
          ''
        ),
        telefonoAlt: String(solicitud.client?.telefonoAlt || ''),
        documento: String(solicitud.client?.documento || solicitud.documento || ''),
        direccionFacturacion: String(
          solicitud.client?.direccionFacturacion || solicitud.client?.address || ''
        ),
        provincia: String(solicitud.client?.provincia || ''),
        ciudad: String(solicitud.client?.ciudad || ''),
        codigoPostal: String(solicitud.client?.codigoPostal || ''),
        estado: String(solicitud.client?.estado || solicitud.estadoCliente || 'PENDIENTE'),
      }));
      
      // Cargar coordenadas automáticamente desde la solicitud/cliente
      const property = solicitud.client?.properties?.[0] || solicitud.properties?.[0];
      const coordsFromProperty = property?.lat && property?.lng && property.lat !== 0 && property.lng !== 0;
      const coordsFromClient = solicitud.client?.lat && solicitud.client?.lng && solicitud.client.lat !== 0 && solicitud.client.lng !== 0;
      const coordsFromSolicitud = solicitud.lat && solicitud.lng && solicitud.lat !== 0 && solicitud.lng !== 0;
      
      if (coordsFromProperty || coordsFromClient || coordsFromSolicitud) {
        setPropertyForm(prev => ({
          ...prev,
          address: prev.address || property?.address || solicitud.address || '',
          lat: prev.lat || String(
            property?.lat && property.lat !== 0 
              ? property.lat 
              : (solicitud.client?.lat && solicitud.client.lat !== 0 
                  ? solicitud.client.lat 
                  : (solicitud.lat && solicitud.lat !== 0 ? solicitud.lat : ''))
          ),
          lng: prev.lng || String(
            property?.lng && property.lng !== 0 
              ? property.lng 
              : (solicitud.client?.lng && solicitud.client.lng !== 0 
                  ? solicitud.client.lng 
                  : (solicitud.lng && solicitud.lng !== 0 ? solicitud.lng : ''))
          ),
        }));
      }
    }
  }, [solicitud]);

  useEffect(() => {
    if (propertyData) {
      setPropertyForm({
        address: String(propertyData.address || solicitud?.address || ''),
        ciudad: String(propertyData.ciudad || ''),
        provincia: String(propertyData.provincia || ''),
        barrio: String(propertyData.barrio || ''),
        tipoPropiedad: String(propertyData.tipoPropiedad || ''),
        tipoConstruccion: String(propertyData.tipoConstruccion || ''),
        ambientes: String(propertyData.ambientes || ''),
        banos: String(propertyData.banos || ''),
        superficieCubiertaM2: String(propertyData.superficieCubiertaM2 || ''),
        superficieDescubiertaM2: String(propertyData.superficieDescubiertaM2 || ''),
        summary: String(propertyData.summary || ''),
        // Cargar coordenadas de múltiples fuentes (prioridad: propiedad > solicitud > cliente)
        lat: String(
          propertyData.lat && propertyData.lat !== 0 
            ? propertyData.lat 
            : (solicitud?.lat && solicitud.lat !== 0 
                ? solicitud.lat 
                : (solicitud?.client?.lat && solicitud.client.lat !== 0 
                    ? solicitud.client.lat 
                    : ''))
        ),
        lng: String(
          propertyData.lng && propertyData.lng !== 0 
            ? propertyData.lng 
            : (solicitud?.lng && solicitud.lng !== 0 
                ? solicitud.lng 
                : (solicitud?.client?.lng && solicitud.client.lng !== 0 
                    ? solicitud.client.lng 
                    : ''))
        ),
      });
    } else if (solicitud) {
      // Si no hay propertyData, cargar coordenadas directamente de la solicitud/cliente
      setPropertyForm(prev => ({
        ...prev,
        address: prev.address || String(solicitud?.address || ''),
        // Cargar coordenadas del cliente/solicitud si no están en propertyForm
        lat: prev.lat || String(
          solicitud?.lat && solicitud.lat !== 0 
            ? solicitud.lat 
            : (solicitud?.client?.lat && solicitud.client.lat !== 0 
                ? solicitud.client.lat 
                : '')
        ),
        lng: prev.lng || String(
          solicitud?.lng && solicitud.lng !== 0 
            ? solicitud.lng 
            : (solicitud?.client?.lng && solicitud.client.lng !== 0 
                ? solicitud.client.lng 
                : '')
        ),
      }));
    }
  }, [propertyData, solicitud]);

  useEffect(() => {
    const loadRemoteData = async () => {
      if (!isOpen || !clientId) return;
      setLoading(true);
      setError(null);
      try {
        const [clientRes, plansRes] = await Promise.all([
          opsApi.get(`/clients/${clientId}`),
          opsApi.get('/plans'),
        ]);

        if (clientRes.success && clientRes.data) {
          const c = clientRes.data as Client;
          setPropertyData(c.properties?.[0] || null);
          const active = getActiveSubscription(c.subscriptions);
          setCurrentPlan(active);
          setSelectedPlanId(active?.planId || '');
          setClientForm((prev) => ({
            ...prev,
            nombreCompleto: c.nombreCompleto || '',
            razonSocial: c.razonSocial || '',
            email: c.email || prev.email || '',
            telefono: c.telefono || c.telefonoCelular || '',
            telefonoAlt: c.telefonoAlt || '',
            documento: c.documento || '',
            direccionFacturacion: c.direccionFacturacion || c.address || '',
            provincia: c.provincia || '',
            ciudad: c.ciudad || '',
            codigoPostal: c.codigoPostal || '',
            estado: c.estado || prev.estado,
          }));
          
          // Cargar coordenadas automáticamente del cliente/propiedad (NO requiere ingreso manual)
          const prop = c.properties?.[0];
          const hasPropCoords = prop?.lat && prop?.lng && prop.lat !== 0 && prop.lng !== 0;
          const hasClientCoords = c.lat && c.lng && c.lat !== 0 && c.lng !== 0;
          
          if (hasPropCoords || hasClientCoords) {
            setPropertyForm(prev => ({
              ...prev,
              // Usar coordenadas de la propiedad primero, luego del cliente
              lat: prev.lat || (hasPropCoords ? String(prop.lat) : String(c.lat)),
              lng: prev.lng || (hasPropCoords ? String(prop.lng) : String(c.lng)),
              address: prev.address || prop?.address || '',
            }));
          }
        }

        if (plansRes.success && Array.isArray(plansRes.data)) {
          setPlans(plansRes.data);
        }
      } catch (err) {
        console.error('[SolicitudDetailModal] Error loading data', err);
        setError('No se pudo cargar la información completa de la solicitud.');
      } finally {
        setLoading(false);
      }
    };

    loadRemoteData();
  }, [clientId, isOpen]);

  if (!isOpen) return null;

  if (!solicitud) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={onClose}></div>
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
              <div className="text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Error
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    No se pudo cargar la información de la solicitud.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleContractChange = (field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      contract: {
        ...(prev.contract || {}),
        planDetails: {
          ...(prev.contract?.planDetails || {}),
          [field === 'price' ? 'price' : field]: value,
        },
      },
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'EN_REVISION':
      case 'EN_PROCESO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PROCESADO':
      case 'ACTIVO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'RECHAZADA':
      case 'SUSPENDIDO':
      case 'INACTIVO':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleStatusChange = async (estado: string) => {
    if (!clientId) return;
    setClientForm((prev) => ({ ...prev, estado }));
    try {
      await opsApi.patch(`/clients/${clientId}/status`, { estado });
      let uiStatus = estado;
      if (estado === 'EN_PROCESO') uiStatus = 'EN_REVISION';
      else if (estado === 'ACTIVO') uiStatus = 'PROCESADO';
      else if (estado === 'SUSPENDIDO' || estado === 'INACTIVO') uiStatus = 'RECHAZADA';
      onUpdateStatus(solicitud.id, uiStatus);
    } catch (err) {
      console.error('[SolicitudDetailModal] Error updating status', err);
      setError('No se pudo actualizar el estado del cliente.');
    }
  };

  const handleApproveClient = async () => {
    // Validar y asegurar que clientId es string
    if (!clientId) {
      setError('No se pudo identificar el cliente. Por favor, cierre y vuelva a abrir la solicitud.');
      return;
    }

    const validClientId: string = typeof clientId === 'string' ? clientId : String(clientId);
    
    if (!selectedPlanId) {
      setError('Debe seleccionar un plan antes de aprobar el cliente.');
      return;
    }

    setApproving(true);
    setError(null);
    setSuccess(null);

    try {
      // Obtener coordenadas de múltiples fuentes (solicitud directa, propiedad, cliente)
      // Prioridad: propertyForm > propertyData > solicitud > solicitud.client
      const lat = propertyForm.lat && propertyForm.lat !== '' && propertyForm.lat !== '0'
        ? Number(propertyForm.lat) 
        : (propertyData?.lat && propertyData.lat !== 0 
            ? Number(propertyData.lat) 
            : (solicitud?.lat && solicitud.lat !== 0 
                ? Number(solicitud.lat) 
                : (solicitud?.client?.lat && solicitud.client.lat !== 0 
                    ? Number(solicitud.client.lat) 
                    : undefined)));
      
      const lng = propertyForm.lng && propertyForm.lng !== '' && propertyForm.lng !== '0'
        ? Number(propertyForm.lng) 
        : (propertyData?.lng && propertyData.lng !== 0 
            ? Number(propertyData.lng) 
            : (solicitud?.lng && solicitud.lng !== 0 
                ? Number(solicitud.lng) 
                : (solicitud?.client?.lng && solicitud.client.lng !== 0 
                    ? Number(solicitud.client.lng) 
                    : undefined)));

      const address = propertyForm.address || propertyData?.address || solicitud?.address || '';

      // Validaciones: solo requerir coordenadas si realmente no existen o son 0,0 (hardcodeadas)
      const hasValidCoordinates = lat && lng && lat !== 0 && lng !== 0;
      
      if (!address) {
        setError('Debe completar la dirección de la propiedad antes de aprobar.');
        setApproving(false);
        return;
      }

      // Solo pedir coordenadas si realmente no existen (no vienen del cliente/solicitud)
      // Si ya vienen del cliente, las usamos automáticamente
      if (!hasValidCoordinates) {
        setError('Las coordenadas son requeridas para aprobar. Si el cliente no las proporcionó durante el registro, por favor complételas manualmente en el formulario de la propiedad.');
        setApproving(false);
        return;
      }

      // Preparar payload para el endpoint unificado
      const approvalData: ApproveClientDto = {
        // Datos del cliente
        telefono: clientForm.telefono,
        telefonoAlt: clientForm.telefonoAlt || undefined,
        documento: clientForm.documento,
        direccionFacturacion: clientForm.direccionFacturacion,
        provincia: clientForm.provincia,
        ciudad: clientForm.ciudad,
        codigoPostal: clientForm.codigoPostal || undefined,

        // Datos del inmueble (usar coordenadas reales, no hardcodeadas)
        propertyAddress: address,
        propertyLat: lat,
        propertyLng: lng,
        tipoPropiedad: propertyForm.tipoPropiedad || 'CASA',
        tipoConstruccion: propertyForm.tipoConstruccion || undefined,
        ambientes: propertyForm.ambientes ? Number(propertyForm.ambientes) : undefined,
        banos: propertyForm.banos ? Number(propertyForm.banos) : undefined,
        superficieCubiertaM2: propertyForm.superficieCubiertaM2 ? Number(propertyForm.superficieCubiertaM2) : undefined,
        superficieDescubiertaM2: propertyForm.superficieDescubiertaM2 ? Number(propertyForm.superficieDescubiertaM2) : undefined,
        barrio: propertyForm.barrio || undefined,
        observacionesPropiedad: propertyForm.summary || undefined,

        // Plan y suscripción (REQUERIDO)
        planId: selectedPlanId,
        billingDay: 1, // Por defecto día 1
        subscriptionStartDate: new Date().toISOString().split('T')[0],

        // Contrato (opcional - puede venir del ContractForm)
        contractStartDate: formData.contract?.startDate 
          ? new Date(formData.contract.startDate as string).toISOString().split('T')[0]
          : undefined,
        contractEndDate: formData.contract?.endDate
          ? new Date(formData.contract.endDate as string).toISOString().split('T')[0]
          : undefined,
        contractNotes: formData.contract?.notes as string || undefined,
      };

      // Llamar al endpoint unificado
      await approveClient(validClientId, approvalData);

      // Éxito
      setSuccess('Cliente aprobado y activado exitosamente. Se envió un email de bienvenida.');
      
      // Recargar datos del cliente
      const refreshed = await opsApi.get(`/clients/${validClientId}`);
      if (refreshed.success && refreshed.data) {
        const updatedClient = refreshed.data as Client;
        setClientForm(prev => ({
          ...prev,
          estado: updatedClient.estado || prev.estado,
        }));
        setPropertyData(updatedClient.properties?.[0] || null);
        const active = getActiveSubscription(updatedClient.subscriptions);
        setCurrentPlan(active);
        setSelectedPlanId(active?.planId || '');
      }

      // Actualizar estado en la lista
      onUpdateStatus(solicitud.id, 'ACTIVO');

      // Cerrar modal después de 3 segundos
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      console.error('[SolicitudDetailModal] Error approving client:', err);
      const error = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'No se pudo aprobar el cliente. Verifique los datos.';
      setError(Array.isArray(message) ? message.join(', ') : String(message));
    } finally {
      setApproving(false);
    }
  };

  const handleSave = async () => {
    if (!clientId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // Actualizar cliente
      const clientPayload = cleanPayload({
        nombreCompleto: clientForm.nombreCompleto,
        razonSocial: clientForm.razonSocial,
        email: clientForm.email,
        telefono: clientForm.telefono,
        telefonoAlt: clientForm.telefonoAlt,
        documento: clientForm.documento,
        direccionFacturacion: clientForm.direccionFacturacion,
        provincia: clientForm.provincia,
        ciudad: clientForm.ciudad,
        codigoPostal: clientForm.codigoPostal,
      });

      if (Object.keys(clientPayload).length > 0) {
        await opsApi.patch(`/clients/${clientId}`, clientPayload);
      }

      // Actualizar propiedad
      if (propertyId) {
        const propertyPayload = cleanPayload({
          address: propertyForm.address,
          ciudad: propertyForm.ciudad,
          provincia: propertyForm.provincia,
          barrio: propertyForm.barrio,
          tipoPropiedad: propertyForm.tipoPropiedad,
          tipoConstruccion: propertyForm.tipoConstruccion,
          ambientes: propertyForm.ambientes ? Number(propertyForm.ambientes) : undefined,
          banos: propertyForm.banos ? Number(propertyForm.banos) : undefined,
          superficieCubiertaM2: propertyForm.superficieCubiertaM2
            ? Number(propertyForm.superficieCubiertaM2)
            : undefined,
          superficieDescubiertaM2: propertyForm.superficieDescubiertaM2
            ? Number(propertyForm.superficieDescubiertaM2)
            : undefined,
          summary: propertyForm.summary,
          lat: propertyForm.lat ? Number(propertyForm.lat) : undefined,
          lng: propertyForm.lng ? Number(propertyForm.lng) : undefined,
        });

        if (Object.keys(propertyPayload).length > 0) {
          await opsApi.put(`/properties/${propertyId}`, propertyPayload);
        }
      }

      // Crear o cambiar suscripción
      if (selectedPlanId) {
        if (!currentPlan) {
          await opsApi.post('/subscriptions', {
            userId: solicitud.client?.userId || clientId,
            clientId,
            planId: selectedPlanId,
            propertyId,
          });
        } else if (currentPlan.planId !== selectedPlanId) {
          await opsApi.patch(`/subscriptions/${currentPlan.id}/upgrade`, {
            planId: selectedPlanId,
          });
        }
      }

      setSuccess('Cambios guardados correctamente.');
      // Recargar datos
      const refreshed = await opsApi.get(`/clients/${clientId}`);
      if (refreshed.success && refreshed.data) {
        const updatedClient = refreshed.data as Client;
        setPropertyData(updatedClient.properties?.[0] || null);
        const active = getActiveSubscription(updatedClient.subscriptions);
        setCurrentPlan(active);
        setSelectedPlanId(active?.planId || '');
      }
    } catch (err) {
      console.error('[SolicitudDetailModal] Error saving changes', err);
      const error = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'No se pudieron guardar los cambios.';
      setError(Array.isArray(message) ? message.join(', ') : String(message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-4 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block bg-white rounded-lg text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full z-10 max-h-[95vh] flex flex-col">
          {/* Header */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between items-center border-b border-gray-200">
            <div>
              <h3 className="text-base leading-6 font-semibold text-gray-900" id="modal-title">
                Solicitud #{solicitud.id?.slice(0, 8) || 'N/A'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Gestión de alta de nuevo suministro</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Botón Aprobar Cliente - solo si está PENDIENTE o EN_PROCESO */}
              {(clientForm.estado === 'PENDIENTE' || clientForm.estado === 'EN_PROCESO') && (
                <button
                  onClick={handleApproveClient}
                  disabled={approving || !selectedPlanId}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!selectedPlanId ? 'Debe seleccionar un plan primero' : 'Aprobar y activar cliente'}
                >
                  {approving ? 'Aprobando...' : '✅ Aprobar y Activar'}
                </button>
              )}
              <select
                value={clientForm.estado}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`text-sm font-medium rounded-full px-3 py-1 border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${getStatusColor(
                  clientForm.estado
                )}`}
              >
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="EN_PROCESO">EN PROCESO</option>
                <option value="ACTIVO">ACTIVO</option>
                <option value="SUSPENDIDO">SUSPENDIDO</option>
                <option value="INACTIVO">INACTIVO</option>
              </select>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Cerrar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('general')}
                className={`${activeTab === 'general' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} w-1/3 py-3 px-1 text-center border-b-2 font-medium text-sm`}
              >
                Información General
              </button>
              <button
                onClick={() => setActiveTab('auditoria')}
                className={`${activeTab === 'auditoria' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} w-1/3 py-3 px-1 text-center border-b-2 font-medium text-sm`}
              >
                Auditoría de Campo
              </button>
              <button
                onClick={() => setActiveTab('contrato')}
                className={`${activeTab === 'contrato' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} w-1/3 py-3 px-1 text-center border-b-2 font-medium text-sm`}
              >
                Contrato Digital
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="bg-gray-50 px-4 py-4 sm:p-6 flex-1 overflow-y-auto min-h-0">
            {loading && (
              <div className="text-sm text-gray-600 mb-4">Cargando datos actualizados...</div>
            )}
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700 border border-green-200">
                {success}
              </div>
            )}

            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* Información del Cliente */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4 border-b pb-2">Datos del Cliente</h4>
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div className="space-y-3">
                      <label className="block">
                        <span className="text-gray-600">Nombre Completo</span>
                        <input
                          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={clientForm.nombreCompleto}
                          onChange={(e) =>
                            setClientForm((prev) => ({ ...prev, nombreCompleto: e.target.value }))
                          }
                        />
                      </label>
                      <label className="block">
                        <span className="text-gray-600">Razón Social</span>
                        <input
                          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={clientForm.razonSocial}
                          onChange={(e) =>
                            setClientForm((prev) => ({ ...prev, razonSocial: e.target.value }))
                          }
                        />
                      </label>
                      <label className="block">
                        <span className="text-gray-600">Email</span>
                        <input
                          className="mt-1 w-full rounded-md border-gray-300 shadow-sm bg-gray-100"
                          value={clientForm.email}
                          readOnly
                        />
                      </label>
                      <label className="block">
                        <span className="text-gray-600">Teléfono</span>
                        <input
                          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={clientForm.telefono}
                          inputMode="tel"
                          maxLength={20}
                          onChange={(e) =>
                            setClientForm((prev) => ({
                              ...prev,
                              telefono: sanitizePhone(e.target.value),
                            }))
                          }
                        />
                      </label>
                      <label className="block">
                        <span className="text-gray-600">Teléfono Alternativo</span>
                        <input
                          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={clientForm.telefonoAlt}
                          inputMode="tel"
                          maxLength={20}
                          onChange={(e) =>
                            setClientForm((prev) => ({
                              ...prev,
                              telefonoAlt: sanitizePhone(e.target.value),
                            }))
                          }
                        />
                      </label>
                    </div>
                    <div className="space-y-3">
                      <label className="block">
                        <span className="text-gray-600">Documento</span>
                        <input
                          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={clientForm.documento}
                          inputMode="text"
                          maxLength={20}
                          onChange={(e) =>
                            setClientForm((prev) => ({
                              ...prev,
                              documento: sanitizeDocument(e.target.value),
                            }))
                          }
                        />
                      </label>
                      <label className="block">
                        <span className="text-gray-600">Dirección de Facturación</span>
                        <input
                          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={clientForm.direccionFacturacion}
                          onChange={(e) =>
                            setClientForm((prev) => ({
                              ...prev,
                              direccionFacturacion: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                          <span className="text-gray-600">Provincia</span>
                          <input
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            value={clientForm.provincia}
                            onChange={(e) =>
                              setClientForm((prev) => ({ ...prev, provincia: e.target.value }))
                            }
                          />
                        </label>
                        <label className="block">
                          <span className="text-gray-600">Ciudad</span>
                          <input
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            value={clientForm.ciudad}
                            onChange={(e) =>
                              setClientForm((prev) => ({ ...prev, ciudad: e.target.value }))
                            }
                          />
                        </label>
                      </div>
                      <label className="block">
                        <span className="text-gray-600">Código Postal</span>
                        <input
                          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={clientForm.codigoPostal}
                          onChange={(e) =>
                            setClientForm((prev) => ({ ...prev, codigoPostal: e.target.value }))
                          }
                        />
                      </label>
                      <div>
                        <span className="text-gray-600">Estado Cliente</span>
                        <div className="mt-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              clientForm.estado
                            )}`}
                          >
                            {clientForm.estado}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dirección / Propiedad */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4 border-b pb-2">Datos del Inmueble</h4>
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div className="space-y-3">
                      <label className="block">
                        <span className="text-gray-600">Dirección</span>
                        <input
                          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={propertyForm.address}
                          onChange={(e) =>
                            setPropertyForm((prev) => ({ ...prev, address: e.target.value }))
                          }
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                          <span className="text-gray-600">Provincia</span>
                          <input
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            value={propertyForm.provincia}
                            onChange={(e) =>
                              setPropertyForm((prev) => ({ ...prev, provincia: e.target.value }))
                            }
                          />
                        </label>
                        <label className="block">
                          <span className="text-gray-600">Ciudad</span>
                          <input
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            value={propertyForm.ciudad}
                            onChange={(e) =>
                              setPropertyForm((prev) => ({ ...prev, ciudad: e.target.value }))
                            }
                          />
                        </label>
                      </div>
                      <label className="block">
                        <span className="text-gray-600">Barrio</span>
                        <input
                          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={propertyForm.barrio}
                          onChange={(e) =>
                            setPropertyForm((prev) => ({ ...prev, barrio: e.target.value }))
                          }
                        />
                      </label>
                      <label className="block">
                        <span className="text-gray-600">Observaciones</span>
                        <textarea
                          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          rows={3}
                          value={propertyForm.summary}
                          onChange={(e) =>
                            setPropertyForm((prev) => ({ ...prev, summary: e.target.value }))
                          }
                        />
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                          <span className="text-gray-600">Tipo Propiedad</span>
                          <select
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            value={propertyForm.tipoPropiedad || ''}
                            onChange={(e) =>
                              setPropertyForm((prev) => ({
                                ...prev,
                                tipoPropiedad: e.target.value,
                              }))
                            }
                          >
                            <option value="">Selecciona una opción</option>
                            {PROPERTY_TYPE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-gray-600">Tipo Construcción</span>
                          <select
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            value={propertyForm.tipoConstruccion || ''}
                            onChange={(e) =>
                              setPropertyForm((prev) => ({
                                ...prev,
                                tipoConstruccion: e.target.value,
                              }))
                            }
                          >
                            <option value="">Selecciona una opción</option>
                            {CONSTRUCTION_TYPE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                          <span className="text-gray-600">Ambientes</span>
                          <input
                            type="number"
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            value={propertyForm.ambientes}
                            onChange={(e) =>
                              setPropertyForm((prev) => ({ ...prev, ambientes: e.target.value }))
                            }
                          />
                        </label>
                        <label className="block">
                          <span className="text-gray-600">Baños</span>
                          <input
                            type="number"
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            value={propertyForm.banos}
                            onChange={(e) =>
                              setPropertyForm((prev) => ({ ...prev, banos: e.target.value }))
                            }
                          />
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                          <span className="text-gray-600">Sup. Cubierta (m²)</span>
                          <input
                            type="number"
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            value={propertyForm.superficieCubiertaM2}
                            onChange={(e) =>
                              setPropertyForm((prev) => ({
                                ...prev,
                                superficieCubiertaM2: e.target.value,
                              }))
                            }
                          />
                        </label>
                        <label className="block">
                          <span className="text-gray-600">Sup. Descubierta (m²)</span>
                          <input
                            type="number"
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            value={propertyForm.superficieDescubiertaM2}
                            onChange={(e) =>
                              setPropertyForm((prev) => ({
                                ...prev,
                                superficieDescubiertaM2: e.target.value,
                              }))
                            }
                          />
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                          <span className="text-gray-600">Lat</span>
                          <input
                            type="number"
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            value={propertyForm.lat}
                            onChange={(e) =>
                              setPropertyForm((prev) => ({ ...prev, lat: e.target.value }))
                            }
                          />
                        </label>
                        <label className="block">
                          <span className="text-gray-600">Lng</span>
                          <input
                            type="number"
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            value={propertyForm.lng}
                            onChange={(e) =>
                              setPropertyForm((prev) => ({ ...prev, lng: e.target.value }))
                            }
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plan / Suscripción */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4 border-b pb-2">Plan y Suscripción</h4>
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div>
                      <p className="text-gray-600 mb-2">Plan actual</p>
                      {currentPlan ? (
                        <div className="p-3 rounded-md border bg-green-50 border-green-200">
                          <div className="font-semibold text-gray-900">{currentPlan.plan?.name || currentPlan.planId}</div>
                          <div className="text-xs text-gray-600 mt-1">Estado: {currentPlan.status}</div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-md border bg-yellow-50 border-yellow-200 text-yellow-800">
                          Sin suscripción activa
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-2">Asignar/Actualizar plan</label>
                      <select
                        className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        value={selectedPlanId}
                        onChange={(e) => setSelectedPlanId(e.target.value)}
                      >
                        <option value="">Selecciona un plan</option>
                        {plans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} - {plan.price ? `$${plan.price}` : ''} {plan.currency || ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-2">
                        Si el cliente no tiene suscripción, se creará con el plan seleccionado.
                        Si ya tiene una activa, se hará upgrade.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Información de la Solicitud */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4 border-b pb-2">Detalle de Solicitud</h4>
                  <dl className="space-y-3 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <dt className="text-gray-500">Tipo:</dt>
                      <dd className="col-span-2 font-medium text-gray-900">{String(solicitud.type || '')}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <dt className="text-gray-500">Fecha Registro:</dt>
                      <dd className="col-span-2 text-gray-900">
                        {solicitud.createdAt ? new Date(String(solicitud.createdAt)).toLocaleString('es-AR') : '-'}
                      </dd>
                    </div>
                    <div className="mt-4">
                      <dt className="text-gray-500 mb-1">Descripción:</dt>
                      <dd className="text-gray-900 bg-gray-50 p-3 rounded border border-gray-100">{String(solicitud.description || '')}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {activeTab === 'auditoria' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Checklist de Instalación</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center space-x-3 p-3 border rounded-md bg-gray-50">
                      <input type="checkbox" checked={solicitud.auditor?.checklist?.electrical} readOnly className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">Instalación Eléctrica OK</span>
                    </label>
                    <label className="flex items-center space-x-3 p-3 border rounded-md bg-gray-50">
                      <input type="checkbox" checked={solicitud.auditor?.checklist?.plumbing} readOnly className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">Plomería OK</span>
                    </label>
                    <label className="flex items-center space-x-3 p-3 border rounded-md bg-gray-50">
                      <input type="checkbox" checked={solicitud.auditor?.checklist?.gas} readOnly className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">Gas OK</span>
                    </label>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Notas del Auditor</h4>
                  <textarea 
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    rows={4}
                    defaultValue={String(solicitud.auditor?.notes || '')}
                    placeholder="Ingrese observaciones de la visita..."
                    readOnly
                  ></textarea>
                </div>
              </div>
            )}

            {activeTab === 'contrato' && (
              <div className="max-h-[70vh] overflow-y-auto">
                <ContractForm 
                  data={formData} 
                  onChange={handleContractChange} 
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-60"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
          
          {/* Branding Footer */}
          <div className="bg-gray-900 text-white p-4 text-center">
            <div className="flex flex-col items-center justify-center">
              <Image
                src="/images/brand/logo-BLANCO-v1.png"
                alt="AARON SERVICIOS"
                width={200}
                height={60}
                className="object-contain mb-2"
                priority
              />
              <p className="text-gray-400 text-xs mt-1">Mantenimiento de tu Hogar las 24hs | &quot;TU TRANQUILIDAD, NUESTRO COMPROMISO.&quot;</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Aprobación */}
    </div>
  );
};
