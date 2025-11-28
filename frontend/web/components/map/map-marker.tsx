/**
 * Componente de Marcador para el Mapa
 * Presentation layer - Renderiza marcadores personalizados en Google Maps
 */

'use client';

import { useEffect, useRef } from 'react';
import { MapMarker, MarkerType } from '@/lib/types/map.types';

interface MapMarkerProps {
  marker: MapMarker;
  map: any;
  onClick?: (marker: MapMarker) => void;
}

export function MapMarkerComponent({ marker, map, onClick }: MapMarkerProps) {
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!map || typeof window === 'undefined' || !(window as any).google?.maps) return;

    const google = (window as any).google;

    // Crear icono personalizado según el tipo de marcador
    const icon = createCustomIcon(marker, google.maps);

    // Crear el marcador clásico (más compatible)
    const googleMarker = new google.maps.Marker({
      map,
      position: marker.position,
      icon,
      title: marker.title,
      animation: google.maps.Animation.DROP,
    });

    // Agregar info window con información básica (preparado para detalles futuros)
    const infoWindow = new google.maps.InfoWindow({
      content: getInfoWindowContent(marker),
    });

    // Agregar evento click único
    googleMarker.addListener('click', () => {
      infoWindow.open(map, googleMarker);
      onClick?.(marker);
    });

    markerRef.current = googleMarker;

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [map, marker, onClick]);

  return null; // Este componente no renderiza nada directamente
}

/**
 * Obtiene el color de fondo según el tipo de marcador
 */
function getMarkerColor(type: MarkerType): string {
  switch (type) {
    case MarkerType.CLIENT:
      return '#3B82F6'; // Azul para clientes
    case MarkerType.OPERATOR:
      return '#10B981'; // Verde para operarios
    default:
      return '#6B7280'; // Gris por defecto
  }
}

/**
 * Obtiene el color del borde según el tipo de marcador
 */
function getMarkerBorderColor(type: MarkerType): string {
  switch (type) {
    case MarkerType.CLIENT:
      return '#1E40AF'; // Azul oscuro
    case MarkerType.OPERATOR:
      return '#059669'; // Verde oscuro
    default:
      return '#4B5563'; // Gris oscuro
  }
}

/**
 * Crea un icono personalizado para el marcador clásico
 */
function createCustomIcon(marker: MapMarker, maps: any): any {
  const color = getMarkerColor(marker.type);
  const borderColor = getMarkerBorderColor(marker.type);

  // Icono según el tipo
  const iconEmoji = marker.type === MarkerType.CLIENT ? '📍' : '🚗';

  // SVG personalizado para el marcador con mejor diseño
  const svg = `
    <svg width="50" height="60" viewBox="0 0 50 60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path d="M25 0 C11 0 0 11 0 25 C0 35 25 60 25 60 C25 60 50 35 50 25 C50 11 39 0 25 0 Z" 
            fill="${color}" stroke="${borderColor}" stroke-width="2.5" filter="url(#shadow)"/>
      <circle cx="25" cy="25" r="10" fill="white"/>
      <text x="25" y="32" font-size="20" text-anchor="middle" font-family="Arial">${iconEmoji}</text>
    </svg>
  `;

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new maps.Size(50, 60),
    anchor: new maps.Point(25, 60),
  };
}

/**
 * Genera HTML para el InfoWindow del marcador
 */
function getInfoWindowContent(marker: MapMarker): string {
  const isClient = marker.type === MarkerType.CLIENT;

  let details = '';
  if (isClient) {
    const clientMarker = marker as any;
    details = `
      <div class="text-xs mt-2">
        ${clientMarker.ordersCount ? `<p>Órdenes: ${clientMarker.ordersCount}</p>` : ''}
        ${clientMarker.claimsCount ? `<p>Reclamos: ${clientMarker.claimsCount}</p>` : ''}
        <p class="mt-1 font-semibold">Estado: ${clientMarker.status === 'active' ? 'Activo' : 'Pendiente'}</p>
      </div>
    `;
  } else {
    const operatorMarker = marker as any;
    details = `
      <div class="text-xs mt-2">
        <p>Estado: ${operatorMarker.status === 'available' ? 'Disponible' : operatorMarker.status === 'busy' ? 'Ocupado' : 'Offline'}</p>
        ${operatorMarker.metadata?.vehicle ? `<p>Vehículo: ${operatorMarker.metadata.vehicle}</p>` : ''}
      </div>
    `;
  }

  return `
    <div style="padding: 8px; min-width: 150px;">
      <h3 style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">${marker.title}</h3>
      <p style="font-size: 12px; color: #666; margin: 0;">${marker.description || ''}</p>
      ${details}
      <p style="font-size: 10px; color: #999; margin-top: 8px;">Click para ver detalles</p>
    </div>
  `;
}

