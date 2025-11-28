/**
 * Plan Mappers
 * Domain layer - Funciones para mapear datos de Plan a SubscriptionPlan
 */

import { Plan } from './types';
import { SubscriptionPlan, PlanColorScheme } from '../mock-data';

// Esquemas de color predefinidos
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

/**
 * Obtener esquema de color basado en el nombre del plan
 */
function getColorScheme(planName: string): PlanColorScheme {
  const nameLower = planName.toLowerCase();
  
  if (nameLower.includes('departamento')) {
    return planColorSchemes.departamento;
  }
  if (nameLower.includes('duplex') || nameLower.includes('dúplex')) {
    return planColorSchemes.duplex;
  }
  if (nameLower.includes('clasica') || nameLower.includes('clásica')) {
    return planColorSchemes.vivienda_clasica;
  }
  if (nameLower.includes('country')) {
    return planColorSchemes.vivienda_country;
  }
  if (nameLower.includes('institucion') || nameLower.includes('institución')) {
    return planColorSchemes.institucion;
  }
  
  // Default: azul
  return planColorSchemes.departamento;
}

/**
 * Extraer características del plan desde restrictions o description
 */
function extractFeatures(plan: Plan & { workTypes?: Array<{ nombre: string }> }): string[] {
  const features: string[] = [];
  
  // Si tiene workTypes, usar esos
  if (plan.workTypes && plan.workTypes.length > 0) {
    plan.workTypes.forEach(wt => {
      features.push(wt.nombre);
    });
  }
  
  // Si tiene características en restrictions
  if (plan.restrictions && typeof plan.restrictions === 'object') {
    const restrictions = plan.restrictions as Record<string, unknown>;
    if (Array.isArray(restrictions.caracteristicas)) {
      restrictions.caracteristicas.forEach((feat: unknown) => {
        if (typeof feat === 'string') {
          features.push(feat);
        }
      });
    }
  }
  
  // Si no hay características, usar description
  if (features.length === 0 && plan.description) {
    const descFeatures = plan.description.split('\n').filter(f => f.trim());
    features.push(...descFeatures);
  }
  
  return features.length > 0 ? features : ['Servicios incluidos según plan'];
}

/**
 * Mapear Plan del backend a SubscriptionPlan para el frontend
 */
export function mapPlanToSubscriptionPlan(plan: Plan & { workTypes?: Array<{ nombre: string }> }): SubscriptionPlan {
  const price = typeof plan.price === 'number' ? plan.price : Number(plan.price);
  const colorScheme = getColorScheme(plan.name);
  const features = extractFeatures(plan);
  
  // Generar slug desde el nombre
  const slug = plan.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  
  // Extraer información de precio desde restrictions si existe
  let priceFrom = price;
  let priceTo: number | undefined;
  let priceNote: string | undefined;
  let surfaceMin: number | undefined;
  let surfaceMax: number | undefined;
  
  if (plan.restrictions && typeof plan.restrictions === 'object') {
    const restrictions = plan.restrictions as Record<string, unknown>;
    if (typeof restrictions.priceFrom === 'number') {
      priceFrom = restrictions.priceFrom;
    }
    if (typeof restrictions.priceTo === 'number') {
      priceTo = restrictions.priceTo;
    }
    if (typeof restrictions.priceNote === 'string') {
      priceNote = restrictions.priceNote;
    }
    if (typeof restrictions.surfaceMin === 'number') {
      surfaceMin = restrictions.surfaceMin;
    }
    if (typeof restrictions.surfaceMax === 'number') {
      surfaceMax = restrictions.surfaceMax;
    }
  }
  
  // Generar tagline desde description o nombre
  const tagline = plan.description 
    ? plan.description.split('\n')[0].substring(0, 80)
    : `Plan ${plan.name}`;
  
  return {
    id: plan.id,
    name: plan.name,
    slug,
    tagline,
    priceFrom,
    priceTo,
    priceNote,
    surfaceMin,
    surfaceMax,
    colorScheme,
    features,
  };
}

