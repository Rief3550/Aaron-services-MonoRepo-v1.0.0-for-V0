import React, { useState } from 'react';
import Image from 'next/image';
import { ContractForm } from './ContractForm';

interface SolicitudDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  solicitud: any;
  onUpdateStatus: (id: string, newStatus: string) => void;
}

export const SolicitudDetailModal: React.FC<SolicitudDetailModalProps> = ({ isOpen, onClose, solicitud, onUpdateStatus }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'auditoria' | 'contrato'>('general');
  const [formData, setFormData] = useState(solicitud);

  React.useEffect(() => {
    if (solicitud) {
      setFormData(solicitud);
    }
  }, [solicitud]);

  if (!isOpen) return null;
  
  if (!solicitud) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
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

  const handleContractChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
      contract: {
        ...prev.contract,
        planDetails: {
            ...prev.contract?.planDetails,
            [field === 'price' ? 'price' : field]: value
        }
      }
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'EN_REVISION': 
      case 'EN_PROCESO': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PROCESADO': 
      case 'ACTIVO': return 'bg-green-100 text-green-800 border-green-200';
      case 'RECHAZADA': 
      case 'SUSPENDIDO':
      case 'INACTIVO': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-4 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block bg-white rounded-lg text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full z-10 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between items-center border-b border-gray-200">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                Solicitud #{solicitud.id?.slice(0, 8) || 'N/A'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">Gestión de alta de nuevo suministro</p>
            </div>
            <div className="flex items-center gap-3">
               {/* Status Dropdown */}
               <select
                value={solicitud.estadoCliente || solicitud.status}
                onChange={(e) => {
                  const newEstado = e.target.value;
                  // Mapear estado del backend al estado de la UI para el callback
                  let uiStatus = newEstado;
                  if (newEstado === 'EN_PROCESO') uiStatus = 'EN_REVISION';
                  else if (newEstado === 'ACTIVO') uiStatus = 'PROCESADO';
                  else if (newEstado === 'SUSPENDIDO' || newEstado === 'INACTIVO') uiStatus = 'RECHAZADA';
                  onUpdateStatus(solicitud.id, uiStatus);
                }}
                className={`text-sm font-medium rounded-full px-3 py-1 border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${getStatusColor(solicitud.estadoCliente || solicitud.status)}`}
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
                className={`${activeTab === 'general' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
              >
                Información General
              </button>
              <button
                onClick={() => setActiveTab('auditoria')}
                className={`${activeTab === 'auditoria' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
              >
                Auditoría de Campo
              </button>
              <button
                onClick={() => setActiveTab('contrato')}
                className={`${activeTab === 'contrato' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
              >
                Contrato Digital
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="bg-gray-50 px-4 py-4 sm:p-6 flex-1 overflow-y-auto min-h-0">
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* Información del Cliente */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4 border-b pb-2">Datos del Cliente</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <dl className="space-y-3 text-sm">
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-gray-500">Nombre Completo:</dt>
                        <dd className="col-span-2 font-medium text-gray-900">{solicitud.client?.nombreCompleto || solicitud.citizen || '-'}</dd>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-gray-500">Razón Social:</dt>
                        <dd className="col-span-2 text-gray-900">{solicitud.client?.razonSocial || solicitud.razonSocial || '-'}</dd>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-gray-500">Email:</dt>
                        <dd className="col-span-2 text-gray-900 break-all">{solicitud.email || '-'}</dd>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-gray-500">Teléfono:</dt>
                        <dd className="col-span-2 text-gray-900">{solicitud.phone || solicitud.client?.telefono || solicitud.client?.telefonoCelular || '-'}</dd>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-gray-500">Tel. Emergencia:</dt>
                        <dd className="col-span-2 text-gray-900">{solicitud.client?.telefonoEmergencia || '-'}</dd>
                      </div>
                    </dl>
                    <dl className="space-y-3 text-sm">
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-gray-500">Tipo Doc:</dt>
                        <dd className="col-span-2 text-gray-900">{solicitud.client?.tipoDocumento || solicitud.tipoDocumento || '-'}</dd>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-gray-500">Documento:</dt>
                        <dd className="col-span-2 font-medium text-gray-900">{solicitud.client?.documento || solicitud.documento || '-'}</dd>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-gray-500">CUIL/CUIT:</dt>
                        <dd className="col-span-2 text-gray-900">{solicitud.client?.cuilCuit || solicitud.cuilCuit || '-'}</dd>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-gray-500">Estado Cliente:</dt>
                        <dd className="col-span-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            solicitud.client?.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                            solicitud.client?.estado === 'EN_PROCESO' ? 'bg-blue-100 text-blue-800' :
                            solicitud.client?.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {solicitud.client?.estado || solicitud.estadoCliente || 'PENDIENTE'}
                          </span>
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Dirección */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4 border-b pb-2">Dirección</h4>
                  <dl className="space-y-3 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <dt className="text-gray-500">Calle:</dt>
                      <dd className="col-span-2 text-gray-900">
                        {solicitud.client?.calle || '-'} {solicitud.client?.numero || ''} 
                        {solicitud.client?.piso ? ` Piso ${solicitud.client.piso}` : ''}
                        {solicitud.client?.departamento ? ` Dpto ${solicitud.client.departamento}` : ''}
                      </dd>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <dt className="text-gray-500">Localidad:</dt>
                      <dd className="col-span-2 text-gray-900">{solicitud.client?.localidad || solicitud.localidad || '-'}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <dt className="text-gray-500">Provincia:</dt>
                      <dd className="col-span-2 text-gray-900">{solicitud.client?.provincia || solicitud.provincia || '-'}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <dt className="text-gray-500">Código Postal:</dt>
                      <dd className="col-span-2 text-gray-900">{solicitud.client?.codigoPostal || solicitud.codigoPostal || '-'}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <dt className="text-gray-500">Dirección Completa:</dt>
                      <dd className="col-span-2 text-gray-900">{solicitud.address || '-'}</dd>
                    </div>
                  </dl>
                </div>

                {/* Información de Auditoría (si existe) */}
                {(solicitud.client?.auditorAsignadoId || solicitud.auditorAsignadoId) && (
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4 border-b pb-2">Información de Auditoría</h4>
                    <dl className="space-y-3 text-sm">
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-gray-500">Auditor Asignado:</dt>
                        <dd className="col-span-2 font-medium text-gray-900">
                          {solicitud.client?.auditorAsignadoNombre || solicitud.auditorAsignadoNombre || 'Sin asignar'}
                        </dd>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-gray-500">Fecha Asignación:</dt>
                        <dd className="col-span-2 text-gray-900">
                          {solicitud.client?.fechaAsignacionAuditor || solicitud.fechaAsignacionAuditor 
                            ? new Date(solicitud.client?.fechaAsignacionAuditor || solicitud.fechaAsignacionAuditor).toLocaleString('es-AR')
                            : '-'}
                        </dd>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-gray-500">Fecha Visita:</dt>
                        <dd className="col-span-2 text-gray-900">
                          {solicitud.client?.fechaVisitaAuditoria || solicitud.fechaVisitaAuditoria
                            ? new Date(solicitud.client?.fechaVisitaAuditoria || solicitud.fechaVisitaAuditoria).toLocaleString('es-AR')
                            : '-'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}

                {/* Datos del Inmueble */}
                {solicitud.client?.properties && solicitud.client.properties.length > 0 && (
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4 border-b pb-2">Datos del Inmueble</h4>
                    {solicitud.client.properties.map((property: any, idx: number) => (
                      <div key={property.id || idx} className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-6">
                          <dl className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                              <dt className="text-gray-500">Dirección:</dt>
                              <dd className="col-span-2 font-medium text-gray-900">{property.address || '-'}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <dt className="text-gray-500">Tipo Propiedad:</dt>
                              <dd className="col-span-2 text-gray-900">{property.tipoPropiedad || '-'}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <dt className="text-gray-500">Tipo Construcción:</dt>
                              <dd className="col-span-2 text-gray-900">{property.tipoConstruccion || '-'}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <dt className="text-gray-500">Ambientes:</dt>
                              <dd className="col-span-2 text-gray-900">{property.ambientes || '-'}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <dt className="text-gray-500">Baños:</dt>
                              <dd className="col-span-2 text-gray-900">{property.banos || '-'}</dd>
                            </div>
                          </dl>
                          <dl className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                              <dt className="text-gray-500">Superficie Cubierta:</dt>
                              <dd className="col-span-2 text-gray-900">{property.superficieCubiertaM2 ? `${property.superficieCubiertaM2} m²` : '-'}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <dt className="text-gray-500">Superficie Descubierta:</dt>
                              <dd className="col-span-2 text-gray-900">{property.superficieDescubiertaM2 ? `${property.superficieDescubiertaM2} m²` : '-'}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <dt className="text-gray-500">Barrio:</dt>
                              <dd className="col-span-2 text-gray-900">{property.barrio || '-'}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <dt className="text-gray-500">Ciudad:</dt>
                              <dd className="col-span-2 text-gray-900">{property.ciudad || '-'}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <dt className="text-gray-500">Provincia:</dt>
                              <dd className="col-span-2 text-gray-900">{property.provincia || '-'}</dd>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <dt className="text-gray-500">Estado:</dt>
                              <dd className="col-span-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  property.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                  property.status === 'PRE_ONBOARD' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {property.status || '-'}
                                </span>
                              </dd>
                            </div>
                          </dl>
                        </div>
                        {property.summary && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <dt className="text-gray-500 mb-1">Observaciones:</dt>
                            <dd className="text-gray-900 bg-gray-50 p-3 rounded border border-gray-100">{property.summary}</dd>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Información de la Solicitud */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4 border-b pb-2">Detalle de Solicitud</h4>
                  <dl className="space-y-3 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <dt className="text-gray-500">Tipo:</dt>
                      <dd className="col-span-2 font-medium text-gray-900">{solicitud.type}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <dt className="text-gray-500">Fecha Registro:</dt>
                      <dd className="col-span-2 text-gray-900">
                        {solicitud.createdAt ? new Date(solicitud.createdAt).toLocaleString('es-AR') : '-'}
                      </dd>
                    </div>
                    <div className="mt-4">
                      <dt className="text-gray-500 mb-1">Descripción:</dt>
                      <dd className="text-gray-900 bg-gray-50 p-3 rounded border border-gray-100">{solicitud.description}</dd>
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
                    defaultValue={solicitud.auditor?.notes}
                    placeholder="Ingrese observaciones de la visita..."
                  ></textarea>
                </div>
              </div>
            )}

            {activeTab === 'contrato' && (
              <ContractForm 
                data={formData} 
                onChange={handleContractChange} 
              />
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Guardar Cambios
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
              <p className="text-gray-400 text-xs mt-1">Mantenimiento de tu Hogar las 24hs | "TU TRANQUILIDAD, NUESTRO COMPROMISO."</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
