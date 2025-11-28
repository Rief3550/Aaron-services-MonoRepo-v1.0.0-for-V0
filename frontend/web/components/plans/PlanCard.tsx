import React from 'react';
import { SubscriptionPlan } from '@/lib/mock-data';

interface PlanCardProps {
  plan: SubscriptionPlan;
  onClick?: () => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, onClick }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div 
      className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
      onClick={onClick}
    >
      {/* Gradient Background */}
      <div className={`${plan.colorScheme.gradient} p-8 text-white relative`}>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16 blur-xl"></div>
        
        {/* Logo Section */}
        <div className="relative z-10 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider font-semibold opacity-90">
              Aaron Servicios
            </div>
            <svg className="w-10 h-10 opacity-80" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.86-.96-7-5.29-7-9V8.3l7-3.11 7 3.11V11c0 3.71-3.14 8.04-7 9z"/>
            </svg>
          </div>
        </div>

        {/* Plan Name */}
        <div className="relative z-10 mb-4">
          <h3 className="text-3xl font-bold tracking-tight mb-2">
            {plan.name}
          </h3>
          <p className="text-sm opacity-90 leading-relaxed">
            {plan.tagline}
          </p>
        </div>

        {/* Price Section */}
        <div className="relative z-10 mt-6 pt-6 border-t border-white/30">
          <div className="flex items-baseline gap-2">
            <span className="text-sm opacity-75">Desde</span>
            <span className="text-4xl font-bold">
              {formatPrice(plan.priceFrom)}
            </span>
            {plan.priceTo && (
              <>
                <span className="text-lg opacity-75">-</span>
                <span className="text-2xl font-semibold">
                  {formatPrice(plan.priceTo)}
                </span>
              </>
            )}
          </div>
          {plan.priceNote && (
            <p className="text-xs mt-1 opacity-75">{plan.priceNote}</p>
          )}
          {plan.surfaceMin && (
            <p className="text-xs mt-1 opacity-75">
              {plan.surfaceMin}m² - {plan.surfaceMax}m²
            </p>
          )}
        </div>
      </div>

      {/* Features List */}
      <div className="bg-white p-6">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Servicios Incluidos
        </h4>
        <ul className="space-y-2.5">
          {plan.features.slice(0, 6).map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
              <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${plan.colorScheme.text}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="leading-tight">{feature}</span>
            </li>
          ))}
          {plan.features.length > 6 && (
            <li className={`text-sm font-medium ${plan.colorScheme.text}`}>
              + {plan.features.length - 6} servicios más
            </li>
          )}
        </ul>

        {/* Highlights */}
        {plan.highlights && plan.highlights.length > 0 && (
          <div className={`mt-4 p-3 rounded-lg ${plan.colorScheme.secondary}`}>
            <p className="text-xs font-semibold text-gray-700 mb-2">Destacados</p>
            <div className="space-y-1">
              {plan.highlights.map((highlight, idx) => (
                <p key={idx} className="text-xs text-gray-600">• {highlight}</p>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};
