import React from 'react';
import Image from 'next/image';

interface ContractFormProps {
  data: any;
  onChange: (field: string, value: any) => void;
  readOnly?: boolean;
}

export const ContractForm: React.FC<ContractFormProps> = ({ data, onChange, readOnly = false }) => {
  return (
    <div className="bg-white p-8 border border-gray-300 shadow-sm max-w-4xl mx-auto text-sm leading-relaxed text-gray-800 font-serif overflow-y-auto max-h-[calc(90vh-180px)] rounded-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Image
            src="/images/brand/logo-negro.png"
            alt="Aaron Servicios"
            width={180}
            height={60}
            className="object-contain"
            priority
          />
        </div>
        <h2 className="text-xl font-bold mt-4 uppercase border-b-2 border-gray-900 inline-block pb-1 tracking-[0.2em]">
          Contrato de Locación de Servicios
        </h2>
      </div>

      {/* Intro */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-2 items-baseline">
          <span>En la ciudad de</span>
          <input 
            type="text" 
            className="border-b border-gray-400 focus:outline-none focus:border-blue-600 px-2 w-40 bg-transparent"
            value={data.city || ''}
            readOnly={readOnly}
            onChange={(e) => onChange('city', e.target.value)}
          />
          <span>, a los</span>
          <input 
            type="text" 
            className="border-b border-gray-400 focus:outline-none focus:border-blue-600 px-2 w-12 text-center bg-transparent"
            value={new Date().getDate()}
            readOnly
          />
          <span>días del mes de</span>
          <input 
            type="text" 
            className="border-b border-gray-400 focus:outline-none focus:border-blue-600 px-2 w-32 text-center bg-transparent"
            value={new Date().toLocaleString('es-ES', { month: 'long' })}
            readOnly
          />
          <span>de 20</span>
          <input 
            type="text" 
            className="border-b border-gray-400 focus:outline-none focus:border-blue-600 px-2 w-12 text-center bg-transparent"
            value={new Date().getFullYear().toString().slice(-2)}
            readOnly
          />
        </div>
        
        <div className="flex flex-wrap gap-2 items-baseline">
          <span>entre</span>
          <input 
            type="text" 
            className="border-b border-gray-400 focus:outline-none focus:border-blue-600 px-2 flex-grow bg-transparent font-bold"
            value={data.citizen || ''}
            readOnly
          />
          <span>DNI N°</span>
          <input 
            type="text" 
            className="border-b border-gray-400 focus:outline-none focus:border-blue-600 px-2 w-32 bg-transparent"
            value={data.dni || ''}
            readOnly={readOnly}
            placeholder="Ingrese DNI"
          />
          <span>, en adelante</span>
        </div>
        
        <div className="flex flex-wrap gap-2 items-baseline">
          <span>EL LOCATARIO y,</span>
          <span className="font-bold border-b border-gray-400 px-2">AARON SERVICIOS S.A.</span>
          <span>, en adelante EL LOCADOR, se conviene celebrar</span>
        </div>
        
        <p>este "contrato de locación de servicios" sujeto a las siguientes condiciones:</p>
      </div>

      {/* Clauses */}
      <div className="space-y-6">
        {/* PRIMERA */}
        <section>
          <h3 className="font-bold mb-2">PRIMERA: OBJETO.</h3>
          <p className="mb-4">El locador prestará al locatario los servicios de:</p>

          <div className="space-y-4 pl-4">
            {/* Plan Departamento */}
            <div className="flex items-start gap-3">
              <input 
                type="checkbox" 
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={data.requestedPlan === 'PLAN DEPARTAMENTO'}
                readOnly={readOnly}
                onChange={() => onChange('requestedPlan', 'PLAN DEPARTAMENTO')}
              />
              <div>
                <h4 className="font-bold text-blue-900">PLAN DEPARTAMENTO</h4>
                <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1 text-xs">
                  <li>Mantenimiento del depto. por 24hs</li>
                  <li>Refacciones de plomería, gas y electricidad</li>
                  <li>Servicio de mantenimiento de aire acondicionados 2 veces al año</li>
                  <li>Mantenimiento de caldera o calefacción 2 veces al año</li>
                  <li>Servicio de emergencia en cerrajería</li>
                  <li>Asesoramiento de remodelación gratuita</li>
                  <li>A los 24 meses se pinta el departamento 100% completo (mano de obra y material a cargo de la empresa)</li>
                </ul>
              </div>
            </div>

            {/* Plan Vivienda Clásica */}
            <div className="flex items-start gap-3">
              <input 
                type="checkbox" 
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={data.requestedPlan === 'PLAN VIVIENDA CLÁSICA'}
                readOnly={readOnly}
                onChange={() => onChange('requestedPlan', 'PLAN VIVIENDA CLÁSICA')}
              />
              <div>
                <h4 className="font-bold text-blue-900">PLAN VIVIENDA CLÁSICA (200m² A 600m²)</h4>
                <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1 text-xs">
                  <li>Incluye todos los servicios del Plan Departamento</li>
                  <li>Mantenimiento parque y patio</li>
                  <li>Servicio de pileta</li>
                  <li>Bonificación del 20% en ampliación/remodelación</li>
                  <li>Mano de obra gratuita de pintura de fachada de la vivienda</li>
                </ul>
              </div>
            </div>
            
             {/* Plan Country */}
             <div className="flex items-start gap-3">
              <input 
                type="checkbox" 
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={data.requestedPlan === 'VIVIENDA COUNTRY'}
                readOnly={readOnly}
                onChange={() => onChange('requestedPlan', 'VIVIENDA COUNTRY')}
              />
              <div>
                <h4 className="font-bold text-blue-900">VIVIENDA COUNTRY DE 600M2 A 1200 M2</h4>
                <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1 text-xs">
                  <li>Servicios premium para grandes superficies</li>
                  <li>Mantenimiento integral de parque, jardín y piscina</li>
                  <li>Regalías de la empresa al afiliado</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SEGUNDA */}
        <section>
          <h3 className="font-bold mb-1">SEGUNDA: COMPROMISO.</h3>
          <p className="text-justify">
            Durante toda la vigencia de este contrato, el locador se compromete a no contratar sus servicios con personas físicas o jurídicas con las que se relacione en razón de esta locación de servicios.
          </p>
        </section>

        {/* TERCERA */}
        <section>
          <h3 className="font-bold mb-1">TERCERA: PRECIO.</h3>
          <div className="text-justify">
            El locatario abonará al locador la suma de $
            <input 
              type="number" 
              className="border-b border-gray-400 focus:outline-none focus:border-blue-600 px-2 w-24 text-center bg-transparent mx-1"
              value={data.contract?.planDetails?.price || ''}
              readOnly={readOnly}
              onChange={(e) => onChange('price', e.target.value)}
            />
            pesos por adelantado y en forma mensual del 1 al 10 de cada mes. La falta de pago en tiempo y forma convenida, devengará en favor del locador un interés del 
            <span className="font-bold mx-1">5%</span> 
            del monto adeudado.
          </div>
        </section>

        {/* CUARTA */}
        <section>
          <h3 className="font-bold mb-1">CUARTA: VIGENCIA.</h3>
          <p>
            Este contrato tendrá una vigencia de <span className="font-bold">24 (veinticuatro) meses</span> a partir de la fecha de firma.
          </p>
        </section>

        {/* QUINTA */}
        <section>
          <h3 className="font-bold mb-1">QUINTA: RESCISIÓN.</h3>
          <p className="text-justify">
            Cualquiera de las partes podrá en cualquier tiempo y por cualquier motivo declarar rescindido este contrato, debiendo comunicarlo con una anticipación no menor de 30 días en forma fehaciente.
          </p>
        </section>
        
        {/* SEXTA */}
        <section>
          <h3 className="font-bold mb-1">SEXTA: PROHIBICIÓN DE CESIÓN.</h3>
          <p className="text-justify">
            Queda prohibida la cesión en todo o en parte de este contrato de locación de servicios. El locador deberá cumplir en forma personal y de acuerdo con las instrucciones que el locatario impartirá el servicio para el que fue contratado.
          </p>
        </section>
      </div>

      {/* Signatures */}
      <div className="mt-16 flex justify-between items-end px-8">
        <div className="text-center">
          <div className="border-t border-gray-800 w-48 mb-2"></div>
          <p className="font-bold">Firma Locatario</p>
          <p className="text-xs text-gray-500">{data.citizen}</p>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-800 w-48 mb-2"></div>
          <p className="font-bold">Firma Locador</p>
          <p className="text-xs text-gray-500">Aaron Servicios S.A.</p>
        </div>
      </div>
    </div>
  );
};
