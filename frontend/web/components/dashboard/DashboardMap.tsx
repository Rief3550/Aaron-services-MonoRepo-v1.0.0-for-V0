'use client';

import React, { useState } from 'react';
import { GoogleMap } from '@/components/map/google-map';
import { MapMarker, MarkerType } from '@/lib/types/map.types';

interface Order {
  id: string;
  state: string;
  lat: number;
  lng: number;
  address: string;
  serviceCategory: string;
  createdAt?: string;
  client?: {
    nombreCompleto?: string;
    razonSocial?: string;
  };
}

interface Crew {
  id: string;
  name: string;
  lat: number;
  lng: number;
  availability: string;
  members: any; // Backend returns Json array
}

interface DashboardMapProps {
  orders: Order[];
  crews: Crew[];
}

export const DashboardMap: React.FC<DashboardMapProps> = ({ orders, crews }) => {
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ lat: number; lng: number } | null>(null);

  const getStateColor = (state: string) => {
    const colors: Record<string, string> = {
      'PENDIENTE': '#EAB308', // yellow
      'ASIGNADA': '#3B82F6', // blue
      'EN_PROGRESO': '#A855F7', // purple
      'FINALIZADA': '#10B981', // green
      'CANCELADA': '#EF4444', // red
    };
    return colors[state] || '#6B7280'; // gray default
  };

  const getCrewColor = (availability: string) => {
    const colors: Record<string, string> = {
      'AVAILABLE': '#10B981', // green
      'BUSY': '#F59E0B', // amber
      'OFFLINE': '#6B7280', // gray
    };
    return colors[availability] || '#6B7280';
  };

  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedMarker(marker);
    setPopupPosition(marker.position);
  };

  const handleClosePopup = () => {
    setSelectedMarker(null);
    setPopupPosition(null);
  };

  // Convert orders to map markers (with house icons)
  const orderMarkers: MapMarker[] = orders.map(order => ({
    id: order.id,
    type: MarkerType.ORDER,
    position: {
      lat: order.lat,
      lng: order.lng,
    },
    title: order.serviceCategory,
    description: order.address,
    color: getStateColor(order.state),
    isCircle: false, // Usar icono en lugar de círculo
    state: order.state,
    address: order.address,
    serviceCategory: order.serviceCategory,
    client: order.client,
    createdAt: order.createdAt,
    icon: 'house', // Usar icono de casa
  }));

  // Convert crews to map markers
  const crewMarkers: MapMarker[] = crews.map(crew => ({
    id: crew.id,
    type: MarkerType.CREW,
    position: {
      lat: crew.lat,
      lng: crew.lng,
    },
    title: crew.name,
    description: `${crew.availability}\n${Array.isArray(crew.members) ? crew.members.length : 0} miembros`,
    color: getCrewColor(crew.availability),
    icon: 'team',
    availability: crew.availability,
    members: crew.members,
  }));

  const allMarkers = [...orderMarkers, ...crewMarkers];

  return (
    <div className="relative w-full" style={{ height: '600px' }}>
        <GoogleMap
          center={{ lat: -29.4131, lng: -66.8558 }} // La Rioja
          zoom={13}
        height="100%"
        className="w-full"
          markers={allMarkers}
        onMarkerClick={handleMarkerClick}
        selectedMarker={selectedMarker}
        popupPosition={popupPosition}
        onClosePopup={handleClosePopup}
      />
    </div>
  );
};
