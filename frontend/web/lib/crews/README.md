# CRUD Structure - Crews Example

Este CRUD de **Cuadrillas** es un ejemplo de cómo replicar la estructura del CRUD de Usuarios. Demuestra que la misma arquitectura funciona para diferentes dominios.

## ✅ Estructura Replicada

Siguiendo el mismo patrón que `lib/users/`:

```
lib/crews/
├── types.ts          # Domain layer - Tipos de cuadrillas
├── api.ts            # Infrastructure layer - Servicios API
└── README.md         # Esta documentación

components/crews/
├── crew-list.tsx     # Presentation layer - Lista con DataTable
└── crew-form.tsx     # Presentation layer - Formulario

app/(app)/admin/cuadrillas/
└── page.tsx          # Presentation layer - Página principal
```

## 🔄 Diferencias con Usuarios

### Particularidades de Cuadrillas

1. **Sin contraseñas**: No necesita validación de contraseña
2. **Estados específicos**: `desocupado`, `ocupado`, `offline`
3. **Progreso**: Campo numérico 0-100 para seguimiento de trabajo
4. **Miembros**: Array de IDs de usuarios (relación N:M)
5. **Zona**: Campo opcional para geolocalización

### Cambios en la Implementación

- **types.ts**: Tipos específicos de Crew en lugar de User
- **api.ts**: Usa `opsApi` en lugar de `gatewayRequest` directo (cuadrillas están en `/ops/crews`)
- **crew-list.tsx**: Columnas específicas (progreso, estado visual)
- **crew-form.tsx**: Formulario simplificado sin validaciones de contraseña

## 📝 Checklist de Replicación Completado

- [x] Crear `lib/crews/types.ts` con tipos del dominio
- [x] Crear `lib/crews/api.ts` con servicios de API
- [x] Crear `components/crews/crew-list.tsx` usando DataTable
- [x] Crear `components/crews/crew-form.tsx` con validaciones
- [x] Crear `app/(app)/admin/cuadrillas/page.tsx` integrando todo
- [x] Ruta ya existe en sidebar (`/admin/cuadrillas`)

## 🎯 Lecciones Aprendidas

1. **Replicación exitosa**: La estructura funciona para diferentes dominios
2. **Adaptación flexible**: Cada CRUD puede tener sus particularidades
3. **Consistencia**: Mismo patrón facilita mantenimiento
4. **Escalabilidad**: Fácil agregar nuevos CRUDs siguiendo el patrón

## 🚀 Próximos CRUDs

Siguiendo esta estructura, puedes replicar para:

- **Suscripciones** (`lib/subscriptions/`)
- **Clientes** (`lib/clients/`)
- **Inmuebles/Propiedades** (`lib/properties/`)
- **Planes** (`lib/plans/`)
- **Tipos de Trabajo** (`lib/work-types/`)

Cada uno con sus particularidades pero manteniendo la estructura base.

