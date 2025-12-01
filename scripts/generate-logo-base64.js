/**
 * Script para convertir el logo a Base64 y guardarlo en los servicios de email
 * Ejecutar: node scripts/generate-logo-base64.js
 */

const fs = require('fs');
const path = require('path');

// Ruta del logo
const logoPath = path.join(__dirname, '../frontend/web/public/images/brand/logo-BLANCO-v1.png');

// Leer y convertir a Base64
const logoBuffer = fs.readFileSync(logoPath);
const logoBase64 = logoBuffer.toString('base64');

// Crear el data URI completo
const logoDataUri = `data:image/png;base64,${logoBase64}`;

// Guardar en los servicios que envían emails
const outputPaths = [
  path.join(__dirname, '../backend/services/auth-service/src/modules/mail/logo-base64.txt'),
  path.join(__dirname, '../backend/services/operations-service/src/modules/clients/logo-base64.txt'),
];

outputPaths.forEach(outputPath => {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, logoBase64);
  console.log(`✅ Logo Base64 guardado en: ${outputPath}`);
});

console.log('\n📊 Tamaño del Base64:', logoBase64.length, 'caracteres');
console.log('🎨 Primeros 100 caracteres:', logoBase64.substring(0, 100) + '...');


