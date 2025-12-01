# Configuración del Estilo del Mapa

## Problema
El estilo personalizado "Delivered 2" creado en Google Cloud Platform no se está aplicando automáticamente.

## Solución

### 1. Verificar que el Estilo esté Asociado al Map ID

En Google Cloud Platform:

1. Ve a **"Administración de mapas"** → **"Diseños de mapa"**
2. Encuentra tu estilo **"Delivered 2"**
3. Verifica que esté asociado al Map ID: `9c96b18e81ab19904121ac45`

Si no está asociado:

1. Ve a **"Administración de mapas"** → **"Map IDs"**
2. Encuentra el Map ID: `9c96b18e81ab19904121ac45`
3. Haz click en **"Editar"** o **"Configurar"**
4. En la sección **"Estilo de mapa"** o **"Map Style"**, selecciona **"Delivered 2"**
5. Guarda los cambios

### 2. Verificar que el Estilo esté Publicado

El estilo debe estar en estado **"Publicado"** (Published), no solo guardado como borrador.

### 3. Verificar el Map ID en el Código

El Map ID está configurado en:
- `next.config.ts`: `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=9c96b18e81ab19904121ac45`
- `components/map/google-map.tsx`: Usa el Map ID al crear el mapa

### 4. Verificar en la Consola del Navegador

Abre las DevTools (F12) y verifica:
- Que no haya errores de CORS
- Que el Map ID se esté cargando correctamente (deberías ver un log: "Mapa inicializado con Map ID: ...")
- Que la API Key tenga permisos para usar el Map ID

## Si el problema persiste:

### Opción 1: Usar el estilo directamente en el código (no recomendado para producción)

```typescript
const map = new google.maps.Map(mapRef.current, {
  mapId: mapId,
  styles: [/* tu estilo JSON aquí */],
});
```

### Opción 2: Verificar que el Map ID esté correcto

1. Ve a Google Cloud Console → "Administración de mapas" → "Map IDs"
2. Verifica que el Map ID `9c96b18e81ab19904121ac45` exista
3. Verifica que tenga el estilo "Delivered 2" (ID `7bcc2d14e02b6d88eafd0924`) asociado
4. Si tienes otro Map ID con el estilo, actualiza `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`

## Debug

Para verificar que el estilo se está aplicando:

1. Abre las DevTools
2. En la consola, escribe: `map.getMapTypeId()` (donde `map` es la instancia del mapa)
3. Inspecciona el elemento del mapa y verifica los estilos aplicados
