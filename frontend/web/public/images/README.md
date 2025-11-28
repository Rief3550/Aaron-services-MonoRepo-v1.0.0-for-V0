# Estructura de Imágenes

Esta carpeta contiene todos los assets de imágenes del frontend, organizados según Clean Architecture por contexto/dominio.

## Estructura de Carpetas

```
public/images/
├── brand/          # Imágenes relacionadas con la marca (logos, iconos de marca)
│   ├── logo_naranja.png    # Logo principal de Aaron Services (para login, header, etc.)
│   └── Loader-logo.png  # Logo para mostrar en loaders/spinners después del login
└── auth/           # Imágenes relacionadas con autenticación
    └── login-side.jpg  # Imagen lateral para la página de login
```

## Cómo Agregar Imágenes

### 1. Logo de la Marca
**Ubicación:** `public/images/brand/logo_naranja.png`

- Formato: PNG con fondo transparente
- Tamaño recomendado: Al menos 200x200px para alta calidad
- El componente de login usará automáticamente esta imagen

### 2. Logo del Loader
**Ubicación:** `public/images/brand/Loader-logo.png`

**⚠️ Nota:** El nombre del archivo respeta mayúsculas/minúsculas (`Loader-logo.png` con L mayúscula)

- Formato recomendado: PNG con fondo transparente
- Tamaño recomendado: Al menos 128x128px para alta calidad
- Este logo se mostrará con animación de pulso en los loaders después del login y durante cargas de la aplicación
- Se usa en el componente `Loader` reutilizable

### 3. Imagen Lateral del Login
**Ubicación:** `public/images/auth/login-side.jpg`

- Formato: JPG
- Tamaño recomendado: 800x1200px o similar (ratio vertical)
- Esta imagen se mostrará en el panel derecho del login con un overlay de color y transparencia

## Uso en Componentes

Las imágenes en `public/` se pueden referenciar directamente usando rutas absolutas desde la raíz:

```tsx
import Image from 'next/image';

// Logo principal
<Image src="/images/brand/logo_naranja.png" alt="Aaron Services" width={200} height={200} />

// Logo del loader
<Image src="/images/brand/Loader-logo.png" alt="Aaron Services" width={96} height={96} />

// Imagen lateral de login
<Image src="/images/auth/login-side.jpg" alt="Login" fill className="object-cover" />
```

## Nota sobre Git

Si las imágenes son muy grandes, considera:
- Optimizarlas antes de subirlas
- Usar herramientas como `imagemin` para comprimir
- Agregar `*.png` o tamaños específicos al `.gitignore` si son demasiado pesadas (aunque en general se recomienda versionarlas)

