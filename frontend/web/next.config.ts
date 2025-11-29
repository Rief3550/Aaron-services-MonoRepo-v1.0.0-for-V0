import path from "path";

import type { NextConfig } from "next";

const isStaticExport = process.env.NEXT_OUTPUT_EXPORT === 'true';

const nextConfig: NextConfig = {
  // Configuración para monorepo
  transpilePackages: ['@shared/types'],

  // Habilita export estático sólo cuando se setea NEXT_OUTPUT_EXPORT=true
  // (evita romper rutas dinámicas en desarrollo)
  output: isStaticExport ? 'export' : undefined,

  // Turbopack disabled for production builds - using webpack for better compatibility
  // turbopack: {
  //   root: path.join(__dirname, "../.."),
  // },
  
  // output: 'export' habilitado para despliegue estático en Docker
  // DISABLED: Static export doesn't support dynamic routes like /ordenes/[id]
  // output: 'export',
  
  env: {
    // URLs base por microservicio (apuntan al Gateway en puerto 3000, pero separables en el futuro)
    // El gateway enruta:
    // - /auth/* → auth-service (puerto 3001)
    // - /ops/* → operations-service (puerto 3002)
    // - /track/* o /tracking/* → tracking-service (puerto 3003)
    NEXT_PUBLIC_AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3100/auth',
    NEXT_PUBLIC_OPS_URL: process.env.NEXT_PUBLIC_OPS_URL || 'http://localhost:3100/ops',
    NEXT_PUBLIC_TRACKING_URL: process.env.NEXT_PUBLIC_TRACKING_URL || 'http://localhost:3100/track',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3003',
    // Google Maps Configuration
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || '9c96b18e81ab1990f6c5f091',
  },

  // Nota: No usamos rewrites porque output: 'export' los desactiva
  // Las URLs se resuelven completamente del lado del cliente
  
  // Deshabilitar optimización de imágenes para export estático
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
