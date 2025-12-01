/**
 * Componente de Google Maps
 * Presentation layer - Mapa interactivo usando @vis.gl/react-google-maps
 */

'use client';

import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, MapMouseEvent } from '@vis.gl/react-google-maps';
import { MapMarker, MarkerType } from '@/lib/types/map.types';

interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  className?: string;
  markers?: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  selectedMarker?: MapMarker | null;
  popupPosition?: { lat: number; lng: number } | null;
  onClosePopup?: () => void;
  onMapClick?: (e: MapMouseEvent) => void;
}

export function GoogleMap({
  center = { lat: -34.6037, lng: -58.3816 }, // Buenos Aires por defecto
  zoom = 13,
  height = '500px',
  className = '',
  markers = [],
  onMarkerClick,
  selectedMarker,
  popupPosition,
  onClosePopup,
  onMapClick,
}: GoogleMapProps) {
  // API Key y Map ID desde variables de entorno o fallback directo
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCxDpBudd3WuLMHmNpUbFeDdExXZuKOaJY';
  
  // Map ID: usar directamente el ID del estilo personalizado "Mapa Delivery v0 dev"
  // Este ID corresponde al estilo oscuro publicado en Google Cloud
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || '9c96b18e81ab19904121ac45';

  // Debug: Verificar configuración del mapa
  if (typeof window !== 'undefined') {
    console.log('🗺️ Google Maps Config:');
    console.log('   Map ID (estilo oscuro):', mapId);
    console.log('   API Key:', apiKey ? `${apiKey.substring(0, 15)}...` : 'NO CONFIGURADA');
    console.log('   ⚠️ Si el mapa no muestra el estilo, verificar en Google Cloud Console:');
    console.log('   1. El Map Style "Mapa Delivery v0 dev" debe estar PUBLICADO');
    console.log('   2. El Map ID', mapId, 'debe estar asociado a ese estilo');
    console.log('   3. La API Key debe tener habilitada la Maps JavaScript API');
    console.log('   4. Verificar que el mapa no tenga restricciones por dominio/IP');
  }

  if (!apiKey) {
    return (
      <div className={`flex items-center justify-center rounded-lg bg-gray-100 ${className}`} style={{ height }}>
        <div className="text-center">
          <p className="text-red-600">API Key de Google Maps no configurada</p>
          <p className="mt-2 text-sm text-gray-500">
            Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en su archivo .env
          </p>
        </div>
      </div>
    );
  }

  // Icono de casa SVG personalizado
  const HouseIcon = ({ color }: { color: string }) => (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
    >
      <path
        d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="white"
      />
    </svg>
  );

  // Custom marker renderer with type guards
  const renderMarker = (marker: MapMarker) => {
    if (marker.type === MarkerType.ORDER) {
      // OrderMarker con icono de casa
      const orderMarker = marker as any;
      const color = orderMarker.color || '#EF4444';
      return (
        <div
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={orderMarker.title}
        >
          <HouseIcon color={color} />
        </div>
      );
    } else if (marker.type === MarkerType.CREW) {
      // CrewMarker con icono de persona
      const crewMarker = marker as any;
      return (
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: crewMarker.color || '#10B981',
            border: '3px solid white',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={crewMarker.title}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 20 20"
            fill="white"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM10 11a6 6 0 00-6 6h12a6 6 0 00-6-6z" />
          </svg>
        </div>
      );
    }
    // Default fallback marker
    return <Pin background={marker.color || '#EF4444'} borderColor="#fff" glyphColor="#fff" />;
  };

  // Render popup content
  const renderPopupContent = (marker: MapMarker) => {
    if (marker.type === MarkerType.ORDER) {
      const orderMarker = marker as any;
      const getStateLabel = (state: string) => {
        const labels: Record<string, string> = {
          'PENDIENTE': 'Pendiente',
          'ASIGNADA': 'Asignada',
          'EN_PROGRESO': 'En Progreso',
          'FINALIZADA': 'Finalizada',
          'CANCELADA': 'Cancelada',
        };
        return labels[state] || state;
      };

      const getStateBadgeColor = (state: string) => {
        const colors: Record<string, string> = {
          'PENDIENTE': 'bg-yellow-100 text-yellow-800',
          'ASIGNADA': 'bg-blue-100 text-blue-800',
          'EN_PROGRESO': 'bg-purple-100 text-purple-800',
          'FINALIZADA': 'bg-green-100 text-green-800',
          'CANCELADA': 'bg-red-100 text-red-800',
        };
        return colors[state] || 'bg-gray-100 text-gray-800';
      };

      return (
        <div className="p-3 min-w-[200px] max-w-[280px]">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">
              {orderMarker.serviceCategory || 'Orden de Trabajo'}
            </h3>
            <button
              onClick={onClosePopup}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          
          <div className="space-y-2">
            <div>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStateBadgeColor(orderMarker.state)}`}>
                {getStateLabel(orderMarker.state)}
              </span>
            </div>
            
            {orderMarker.address && (
              <div className="flex items-start gap-2">
                <svg width="14" height="14" className="mt-0.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-xs text-gray-600 line-clamp-2">{orderMarker.address}</p>
              </div>
            )}
            
            {orderMarker.client && (
              <div className="flex items-start gap-2">
                <svg width="14" height="14" className="mt-0.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="text-xs text-gray-600">
                  {orderMarker.client.nombreCompleto || orderMarker.client.razonSocial || 'Cliente'}
                </p>
              </div>
            )}
            
            {orderMarker.createdAt && (
              <div className="flex items-start gap-2">
                <svg width="14" height="14" className="mt-0.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs text-gray-500">
                  {new Date(orderMarker.createdAt).toLocaleDateString('es-AR')}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    } else if (marker.type === MarkerType.CREW) {
      const crewMarker = marker as any;
      const getAvailabilityLabel = (availability: string) => {
        const labels: Record<string, string> = {
          'AVAILABLE': 'Disponible',
          'BUSY': 'Ocupada',
          'OFFLINE': 'Offline',
        };
        return labels[availability] || availability;
      };

      return (
        <div className="p-3 min-w-[180px]">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-sm text-gray-900">{crewMarker.title}</h3>
            <button
              onClick={onClosePopup}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-600 mb-1">
            Estado: {getAvailabilityLabel(crewMarker.availability)}
          </p>
          {Array.isArray(crewMarker.members) && (
            <p className="text-xs text-gray-500">
              {crewMarker.members.length} {crewMarker.members.length === 1 ? 'miembro' : 'miembros'}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          mapId={mapId}
          style={{ width: '100%', height: '100%' }}
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
          mapTypeControl={false}
          scaleControl={true}
          streetViewControl={true}
          rotateControl={false}
          fullscreenControl={true}
          onClick={onMapClick}
          onLoad={() => {
            console.log('✅ Mapa cargado con Map ID:', mapId);
          }}
        >
          {/* Renderizar marcadores personalizados */}
          {markers.map((marker) => (
            <AdvancedMarker
              key={marker.id}
              position={marker.position}
              title={marker.title}
              onClick={() => onMarkerClick?.(marker)}
            >
              {renderMarker(marker)}
            </AdvancedMarker>
          ))}

          {/* Popup con información del marcador seleccionado */}
          {selectedMarker && popupPosition && (
            <InfoWindow
              position={popupPosition}
              onCloseClick={onClosePopup}
            >
              {renderPopupContent(selectedMarker)}
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
