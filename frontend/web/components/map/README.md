# Componentes del Mapa

## Estructura

El sistema de mapas está diseñado para mostrar dos tipos de marcadores:

### 1. **Clientes** (ClientMarker)
- Icono: 📍 (azul)
- Representa clientes con órdenes activas o reclamos pendientes
- Información incluye:
  - Nombre del cliente
  - Cantidad de órdenes activas
  - Cantidad de reclamos
  - Estado (activo, pendiente, resuelto)
  - Metadata (teléfono, email, dirección, etc.)

### 2. **Operarios** (OperatorMarker)
- Icono: 🚗 (verde)
- Representa operarios con la app en funcionamiento
- Información incluye:
  - Nombre del operario
  - Estado (disponible, ocupado, offline)
  - ID de orden actual (si está trabajando)
  - Metadata (teléfono, vehículo, últimas actualizaciones, etc.)

## Uso

```tsx
import { GoogleMap } from '@/components/map/google-map';
import { mockAllMarkers } from '@/lib/data/mock-map-data';

<GoogleMap
  center={{ lat: -34.6037, lng: -58.3816 }}
  zoom={12}
  height="500px"
  markers={mockAllMarkers}
  onMarkerClick={(marker) => {
    console.log('Marcador clickeado:', marker);
    // Abrir modal o mostrar detalles
  }}
/>
```

## Configuración

### Variables de Entorno

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=9c96b18e81ab1990f6c5f091
```

### Obtener API Key

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Habilita "Maps JavaScript API"
3. Crea una API Key en "Credenciales"
4. Restringe la API Key a tu dominio (opcional pero recomendado)

## Próximos Pasos

- [ ] Conectar con API del backend para obtener marcadores reales
- [ ] Agregar modal de detalles al hacer click en un marcador
- [ ] Implementar filtros para mostrar/ocultar tipos de marcadores
- [ ] Agregar actualización en tiempo real de posiciones de operarios
- [ ] Agregar clustering cuando hay muchos marcadores cercanos


