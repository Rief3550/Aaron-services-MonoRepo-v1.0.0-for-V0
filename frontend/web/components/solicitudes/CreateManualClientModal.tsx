import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { createManualClient, CreateManualClientDto } from '@/lib/clients/api';
import { fetchPlans, Plan } from '@/lib/plans/api';
import { GoogleMap } from '@/components/map/google-map';
import { MapMouseEvent } from '@vis.gl/react-google-maps';

interface CreateManualClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateManualClientModal({ isOpen, onClose, onSuccess }: CreateManualClientModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [formData, setFormData] = useState<CreateManualClientDto>({
    email: '',
    password: '',
    fullName: '',
    telefono: '',
    documento: '',
    direccionFacturacion: '',
    lat: -29.4131, // Default La Rioja
    lng: -66.8558,
    tipoPropiedad: 'CASA',
    tipoConstruccion: 'TRADICIONAL',
    ambientes: 1,
    banos: 1,
    superficieCubiertaM2: 0,
    superficieDescubiertaM2: 0,
    barrio: '',
    ciudad: 'La Rioja',
    provincia: 'La Rioja',
    planId: '',
    observaciones: '',
    observacionesPropiedad: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchPlans(true).then(setPlans).catch(console.error);
      setStep(1);
      setLoading(false);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'ambientes' || name === 'banos' || name.includes('superficie') 
        ? Number(value) 
        : value
    }));
  };

  // Simulación de obtener dirección por coordenadas (reverse geocoding podría ir aquí)
  const handleMapClick = (e: MapMouseEvent) => {
    if (e.detail.latLng) {
      const lat = e.detail.latLng.lat;
      const lng = e.detail.latLng.lng;
      setFormData(prev => ({ ...prev, lat, lng }));
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await createManualClient(formData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Error al crear el cliente. Verifique los datos.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  // Validaciones básicas para habilitar "Siguiente"
  const isStep1Valid = formData.fullName && formData.email && formData.telefono && formData.documento && formData.password && formData.password.length >= 6;
  const isStep2Valid = formData.direccionFacturacion && formData.lat && formData.lng && formData.barrio;
  const isStep3Valid = formData.planId;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Solicitud Manual (Operador)" size="2xl">
      <div className="p-6 space-y-6">
        {/* Stepper */}
        <div className="flex items-center justify-center space-x-4 text-sm">
          <div className={`flex items-center ${step >= 1 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center border mr-2 ${step >= 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>1</span>
            Cliente
          </div>
          <div className="w-8 h-px bg-gray-300"></div>
          <div className={`flex items-center ${step >= 2 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center border mr-2 ${step >= 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>2</span>
            Propiedad
          </div>
          <div className="w-8 h-px bg-gray-300"></div>
          <div className={`flex items-center ${step >= 3 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center border mr-2 ${step >= 3 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>3</span>
            Plan
          </div>
        </div>

        {/* Step 1: Cliente */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input type="password" name="password" value={formData.password || ''} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">DNI / CUIT</label>
              <input type="text" name="documento" value={formData.documento} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Observaciones Cliente</label>
              <textarea name="observaciones" value={formData.observaciones} onChange={handleChange} rows={2} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"></textarea>
            </div>
          </div>
        )}

        {/* Step 2: Propiedad */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Dirección</label>
                <input type="text" name="direccionFacturacion" value={formData.direccionFacturacion} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Calle y altura" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Barrio</label>
                <input type="text" name="barrio" value={formData.barrio} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
            </div>

            {/* Mapa */}
            <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300 relative">
               <GoogleMap 
                 center={{ lat: formData.lat, lng: formData.lng }}
                 zoom={14}
                 onMapClick={handleMapClick}
               />
               <div className="absolute top-2 left-2 bg-white px-2 py-1 rounded shadow text-xs font-bold">
                  Click para ubicar: {formData.lat.toFixed(4)}, {formData.lng.toFixed(4)}
               </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <select name="tipoPropiedad" value={formData.tipoPropiedad} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option value="CASA">Casa</option>
                  <option value="DEPARTAMENTO">Departamento</option>
                  <option value="COMERCIO">Comercio</option>
                  <option value="LOTE_BALDIO">Lote Baldío</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Construcción</label>
                <select name="tipoConstruccion" value={formData.tipoConstruccion} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option value="TRADICIONAL">Tradicional</option>
                  <option value="PREFABRICADA">Prefabricada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ambientes</label>
                <input type="number" name="ambientes" value={formData.ambientes} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Baños</label>
                <input type="number" name="banos" value={formData.banos} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700">Sup. Cubierta (m2)</label>
                 <input type="number" name="superficieCubiertaM2" value={formData.superficieCubiertaM2} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700">Sup. Desc. (m2)</label>
                 <input type="number" name="superficieDescubiertaM2" value={formData.superficieDescubiertaM2} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Plan y Confirmación */}
        {step === 3 && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Seleccionar Plan</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map(plan => (
                <div 
                  key={plan.id}
                  onClick={() => setFormData(prev => ({ ...prev, planId: plan.id }))}
                  className={`cursor-pointer border rounded-lg p-4 transition-all ${formData.planId === plan.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'hover:border-gray-400'}`}
                >
                  <div className="font-bold text-gray-900">{plan.name}</div>
                  <div className="text-sm text-gray-500">{plan.description}</div>
                  <div className="mt-2 font-semibold text-blue-600">${plan.price} {plan.currency}</div>
                </div>
              ))}
            </div>

            {formData.planId && (
               <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-medium text-gray-900 mb-2">Resumen</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                     <li><strong>Cliente:</strong> {formData.fullName} ({formData.email})</li>
                     <li><strong>Propiedad:</strong> {formData.direccionFacturacion}, {formData.barrio}</li>
                     <li><strong>Tipo:</strong> {formData.tipoPropiedad}</li>
                     <li><strong>Plan:</strong> {plans.find(p => p.id === formData.planId)?.name}</li>
                  </ul>
               </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          {step > 1 && (
            <button onClick={prevStep} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Atrás
            </button>
          )}
          
          {step < 3 ? (
            <button 
               onClick={nextStep} 
               disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
               className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          ) : (
            <button 
               onClick={handleSubmit} 
               disabled={!isStep3Valid || loading}
               className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
               {loading && <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
               Confirmar y Crear
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

