import { OrderState } from '@/components/ui/budget-card';

// Tipos para los datos simulados
export interface MockDashboardData {
  kpi: {
    reclamosTotales: number;
    incidentesHoy: number;
    visitasHoy: number;
    ordenesEnCurso: number;
  };
  orderStats: Record<OrderState, number>;
  chartSeries: {
    periodo: string;
    pendiente: number;
    en_curso: number;
    finalizado: number;
    cancelado: number;
  }[];
  recentOrders: {
    id: string;
    serviceCategory: string;
    state: OrderState;
    address: string;
    createdAt: string;
    operator: string;
  }[];
}

// Generador de datos aleatorios
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const getMockDashboardData = (): MockDashboardData => {
  // 1. KPI Data
  const kpi = {
    reclamosTotales: getRandomInt(150, 300),
    incidentesHoy: getRandomInt(5, 20),
    visitasHoy: getRandomInt(10, 30),
    ordenesEnCurso: getRandomInt(8, 15),
  };

  // 2. Order Stats
  const orderStats: Record<OrderState, number> = {
    PENDIENTE: getRandomInt(10, 25),
    ASIGNADA: getRandomInt(15, 30),
    EN_PROGRESO: kpi.ordenesEnCurso,
    FINALIZADA: getRandomInt(40, 80),
    CANCELADA: getRandomInt(2, 8),
  };

  // 3. Chart Series (Last 7 days)
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const chartSeries = days.map(day => ({
    periodo: day,
    pendiente: getRandomInt(2, 8),
    en_curso: getRandomInt(5, 12),
    finalizado: getRandomInt(8, 20),
    cancelado: getRandomInt(0, 3),
  }));

  // 4. Recent Orders
  const services = ['Reparación de Luminaria', 'Cambio de Lámpara', 'Mantenimiento Preventivo', 'Instalación Nueva', 'Revisión de Tablero'];
  const addresses = ['Av. San Martín 123', 'Calle Belgrano 456', 'Ruta 5 Km 10', 'Barrio Centro Mz 4', 'Plaza Principal'];
  const operators = ['Juan Pérez', 'María González', 'Carlos López', 'Ana Martínez', 'Pedro Sánchez'];
  
  const recentOrders = Array.from({ length: 10 }).map((_, i) => {
    const stateKeys: OrderState[] = ['PENDIENTE', 'ASIGNADA', 'EN_PROGRESO', 'FINALIZADA', 'CANCELADA'];
    const randomState = stateKeys[getRandomInt(0, 4)];
    const date = new Date();
    date.setDate(date.getDate() - getRandomInt(0, 5));

    return {
      id: `ORD-${2025001 + i}`,
      serviceCategory: services[getRandomInt(0, services.length - 1)],
      state: randomState,
      address: addresses[getRandomInt(0, addresses.length - 1)],
      createdAt: date.toISOString(),
      operator: operators[getRandomInt(0, operators.length - 1)],
    };
  });

  return {
    kpi,
    orderStats,
    chartSeries,
    recentOrders,
  };
};

export const getMockOrders = () => {
  const services = ['Reparación de Luminaria', 'Cambio de Lámpara', 'Mantenimiento Preventivo', 'Instalación Nueva', 'Revisión de Tablero'];
  const addresses = ['Av. San Martín 123', 'Calle Belgrano 456', 'Ruta 5 Km 10', 'Barrio Centro Mz 4', 'Plaza Principal'];
  const operators = ['Juan Pérez', 'María González', 'Carlos López', 'Ana Martínez', 'Pedro Sánchez'];
  const crews = ['Cuadrilla Norte', 'Cuadrilla Sur', 'Cuadrilla Este', 'Cuadrilla Oeste'];
  
  // La Rioja, Argentina center: -29.4131, -66.8558
  const LA_RIOJA_CENTER = { lat: -29.4131, lng: -66.8558 };

  return Array.from({ length: 10 }).map((_, i) => {
    const stateKeys: OrderState[] = ['PENDIENTE', 'ASIGNADA', 'EN_PROGRESO', 'FINALIZADA', 'CANCELADA'];
    const randomState = stateKeys[getRandomInt(0, 4)];
    const date = new Date();
    date.setDate(date.getDate() - getRandomInt(0, 30));
    
    // Generate coordinates around La Rioja (spread ~0.05 degrees = ~5km radius)
    const lat = LA_RIOJA_CENTER.lat + (Math.random() - 0.5) * 0.1;
    const lng = LA_RIOJA_CENTER.lng + (Math.random() - 0.5) * 0.1;

    return {
      id: `ORD-${2025001 + i}`,
      serviceCategory: services[getRandomInt(0, services.length - 1)],
      state: randomState,
      address: addresses[getRandomInt(0, addresses.length - 1)],
      lat,
      lng,
      createdAt: date.toISOString(),
      crew: randomState !== 'PENDIENTE' ? { name: crews[getRandomInt(0, crews.length - 1)] } : undefined,
      prioridad: ['ALTA', 'MEDIA', 'BAJA'][getRandomInt(0, 2)],
      client: { nombre: `Cliente ${i + 1}` },
    };
  });
};

export const getMockCrews = () => {
  // Fixed crew locations around La Rioja
  return [
    {
      id: 'crew-1',
      name: 'Cuadrilla Norte',
      lat: -29.3950,
      lng: -66.8450,
      availability: 'AVAILABLE',
      members: 3
    },
    {
      id: 'crew-2',
      name: 'Cuadrilla Sur',
      lat: -29.4300,
      lng: -66.8650,
      availability: 'BUSY',
      members: 4
    },
    {
      id: 'crew-3',
      name: 'Cuadrilla Este',
      lat: -29.4100,
      lng: -66.8350,
      availability: 'AVAILABLE',
      members: 3
    },
    {
      id: 'crew-4',
      name: 'Cuadrilla Oeste',
      lat: -29.4200,
      lng: -66.8750,
      availability: 'OFFLINE',
      members: 2
    }
  ];
};

export const getMockSolicitudes = () => {
  const types = ['Reclamo', 'Solicitud de Servicio', 'Denuncia', 'Consulta'];
  const statuses = ['PENDIENTE', 'EN_REVISION', 'PROCESADO', 'RECHAZADA'];
  const plans = ['PLAN DEPARTAMENTO', 'PLAN VIVIENDA CLÁSICA', 'VIVIENDA COUNTRY', 'PLAN DÚPLEX', 'PLAN INSTITUCIÓN'];
  
  return Array.from({ length: 15 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - getRandomInt(0, 10));
    
    return {
      id: `SOL-${1000 + i}`,
      type: types[getRandomInt(0, types.length - 1)],
      description: 'Solicitud de alta de nuevo suministro y mantenimiento integral.',
      status: statuses[getRandomInt(0, 2)], // Mostly Pending, In Revision, or Processed
      citizen: `Ciudadano ${i + 1}`,
      email: `ciudadano${i + 1}@email.com`,
      phone: `+54 11 1234 567${i}`,
      address: `Calle ${getRandomInt(1, 100)} N° ${getRandomInt(100, 999)}`,
      city: 'Buenos Aires',
      requestedPlan: plans[getRandomInt(0, plans.length - 1)],
      createdAt: date.toISOString(),
      contract: {
        signed: Math.random() > 0.5,
        signedAt: Math.random() > 0.5 ? new Date().toISOString() : undefined,
        planDetails: {
          rooms: getRandomInt(1, 4),
          price: getRandomInt(25000, 90000),
        }
      },
      auditor: {
        notes: 'Visita realizada. Instalación eléctrica en condiciones. Se requiere cambio de térmica.',
        visitedAt: new Date().toISOString(),
        checklist: {
          electrical: true,
          plumbing: true,
          gas: false,
        }
      }
    };
  });
};

// ========== SUBSCRIPTION PLANS ==========

export interface PlanColorScheme {
  primary: string;
  secondary: string;
  gradient: string;
  text: string;
  badge: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  priceFrom: number;
  priceTo?: number;
  priceNote?: string;
  surfaceMin?: number;
  surfaceMax?: number;
  colorScheme: PlanColorScheme;
  features: string[];
  highlights?: string[];
}

const planColorSchemes: Record<string, PlanColorScheme> = {
  departamento: {
    primary: 'from-blue-500 to-indigo-600',
    secondary: 'bg-blue-50 border-blue-200',
    gradient: 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600',
    text: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  duplex: {
    primary: 'from-purple-500 to-violet-600',
    secondary: 'bg-purple-50 border-purple-200',
    gradient: 'bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-600',
    text: 'text-purple-600',
    badge: 'bg-purple-100 text-purple-800 border-purple-300'
  },
  vivienda_clasica: {
    primary: 'from-green-500 to-emerald-600',
    secondary: 'bg-green-50 border-green-200',
    gradient: 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600',
    text: 'text-green-600',
    badge: 'bg-green-100 text-green-800 border-green-300'
  },
  vivienda_country: {
    primary: 'from-orange-500 to-amber-600',
    secondary: 'bg-orange-50 border-orange-200',
    gradient: 'bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-600',
    text: 'text-orange-600',
    badge: 'bg-orange-100 text-orange-800 border-orange-300'
  },
  institucion: {
    primary: 'from-red-500 to-rose-600',
    secondary: 'bg-red-50 border-red-200',
    gradient: 'bg-gradient-to-br from-red-500 via-rose-500 to-pink-600',
    text: 'text-red-600',
    badge: 'bg-red-100 text-red-800 border-red-300'
  }
};

export const getMockPlans = (): SubscriptionPlan[] => {
  return [
    {
      id: 'plan-1',
      name: 'DEPARTAMENTOS',
      slug: 'departamento',
      tagline: 'Desde $25MIL dependiendo de la cantidad de ambientes',
      priceFrom: 25000,
      priceTo: 40000,
      priceNote: 'Según ambientes',
      colorScheme: planColorSchemes.departamento,
      features: [
        'Mantenimiento 24hs',
        'Refacciones de plomería, gas y electricidad',
        'Servicio de mantenimiento de aire acondicionados 2 veces al año',
        'Mantenimiento de caldera o calefacción 2 veces al año',
        'Servicio de emergencia en cerrajería',
        'Asesoramiento de remodelación gratuita',
        'A los 24 meses se pinta el departamento completo. Mano de obra y material 100% a cargo de la empresa.'
      ],
      highlights: ['Monoambiente: $25.000', '1 ambiente: $30.000', '2 ambientes: $35.000', '3 ambientes: $40.000']
    },
    {
      id: 'plan-2',
      name: 'DÚPLEX',
      slug: 'duplex',
      tagline: 'Desde $35 MIL dependiendo de la cantidad de ambientes',
      priceFrom: 35000,
      priceTo: 40000,
      priceNote: 'Según ambientes',
      colorScheme: planColorSchemes.duplex,
      features: [
        'Mantenimiento 24hs',
        'Refacciones de plomería, gas y electricidad',
        'Servicio de mantenimiento de aire acondicionados 2 veces al año',
        'Mantenimiento de caldera o calefacción 2 veces al año',
        'Servicio de emergencia en cerrajería',
        'Asesoramiento de remodelación gratuita',
        'Pintura de la vivienda. Mano de obra y material 100% a cargo de la empresa.'
      ],
      highlights: ['2 ambientes: $35.000', '3 ambientes: $40.000']
    },
    {
      id: 'plan-3',
      name: 'VIVIENDA CLÁSICA',
      slug: 'vivienda_clasica',
      tagline: '200m² a 600m²',
      priceFrom: 70000,
      surfaceMin: 200,
      surfaceMax: 600,
      colorScheme: planColorSchemes.vivienda_clasica,
      features: [
        'Mantenimiento las 24hs',
        'Refacciones de urgencia de plomería, gas y electricidad',
        'Servicio de mantenimiento de aire acondicionados 2 veces al año',
        'Servicio de mantenimiento de calefacción 2 veces al año',
        'Servicio de emergencia en cerrajería',
        'Mantenimiento parque y patio',
        'Servicio de pileta',
        'Asesoramiento de remodelación o ampliación gratuita',
        'Bonificación del 20% en cada trabajo de ampliación o remodelación de la propiedad',
        'Beneficio de financiación de obra hasta 3 cuotas sin interés',
        'Regalías de la empresa al afiliado',
        'Mano de obra gratuita de pintura de fachada de la vivienda'
      ]
    },
    {
      id: 'plan-4',
      name: 'VIVIENDA COUNTRY',
      slug: 'vivienda_country',
      tagline: '600 a 1200m²',
      priceFrom: 90000,
      surfaceMin: 600,
      surfaceMax: 1200,
      colorScheme: planColorSchemes.vivienda_country,
      features: [
        'Mantenimiento las 24hs',
        'Refacciones de urgencia de plomería, gas y electricidad',
        'Servicio de mantenimiento de aire acondicionados 2 veces al año',
        'Servicio de mantenimiento de calefacción 2 veces al año',
        'Servicio de emergencia en cerrajería',
        'Mantenimiento de parque y jardín',
        'Mantenimiento de piscina',
        'Asesoramiento de remodelación o ampliación gratuita',
        'Bonificación del 20% en cada trabajo de ampliación o remodelación de la propiedad',
        'Beneficio de financiación de obra hasta 3 cuotas sin interés con interés 6 meses',
        'Regalías de la empresa al afiliado',
        'Pintura de fachada de la vivienda 100% a cargo de la empresa'
      ]
    },
    {
      id: 'plan-5',
      name: 'INSTITUCIÓN',
      slug: 'institucion',
      tagline: 'Planes desde $35MIL',
      priceFrom: 35000,
      priceNote: 'Por ambiente',
      colorScheme: planColorSchemes.institucion,
      features: [
        'Mantenimiento del depto. por 24hs',
        'Refacciones de plomería, gas y electricidad',
        'Servicio de mantenimiento de aires acondicionados',
        'Servicio de mantenimiento de caldera o calefacción 2 veces al año',
        'Servicio de emergencia en cerrajería',
        'Asesoramiento de remodelación gratuita',
        'A los 24 meses se pinta el departamento 16m² C/u 35 mil pesos',
        '3 ambiente 40 mil pesos',
        '4 ambiente 45 mil pesos',
        'Y así por cada ambiente'
      ],
      highlights: ['Oficinas, escuelas, universidades, centros de estudios, bibliotecas, ONGs']
    }
  ];
};
