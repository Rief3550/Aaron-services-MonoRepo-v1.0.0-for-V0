/**
 * Seed de prueba: Crear una cuadrilla de ejemplo
 * 
 * NOTA: Este seed está comentado para usar solo datos reales.
 * Descomentar si necesitas datos de prueba para desarrollo.
 */
/* eslint-disable no-console */
import { PrismaClient } from '@aaron/prisma-client-ops';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('✅ Seed completado - No se crean datos de prueba');
  console.log('💡 Para crear datos de prueba, descomenta el código en seed.ts');
  
  // ============================================
  // SEED DE PRUEBA COMENTADO - Usar solo datos reales
  // ============================================
  /*
  console.log('🌱 Seeding test crew...');

  // Buscar si ya existe una cuadrilla con este nombre
  const existingCrew = await prisma.crew.findFirst({
    where: { name: 'Cuadrilla Norte' },
  });

  let testCrew;
  if (existingCrew) {
    // Actualizar la cuadrilla existente
    testCrew = await prisma.crew.update({
      where: { id: existingCrew.id },
      data: {
        zona: 'Zona Norte - La Rioja',
        members: ['user-1', 'user-2', 'user-3'], // IDs de ejemplo
        availability: 'AVAILABLE',
        state: 'desocupado',
        progress: 0,
        notes: 'Cuadrilla de prueba para desarrollo',
        lat: -29.3950,
        lng: -66.8450,
        lastLocationAt: new Date(),
      },
    });
    console.log(`✅ Test crew updated: ${testCrew.name}`);
  } else {
    // Crear nueva cuadrilla
    testCrew = await prisma.crew.create({
      data: {
        name: 'Cuadrilla Norte',
        zona: 'Zona Norte - La Rioja',
        members: ['user-1', 'user-2', 'user-3'], // IDs de ejemplo
        availability: 'AVAILABLE',
        state: 'desocupado',
        progress: 0,
        notes: 'Cuadrilla de prueba para desarrollo',
        lat: -29.3950,
        lng: -66.8450,
        lastLocationAt: new Date(),
      },
    });
    console.log(`✅ Test crew created: ${testCrew.name}`);
  }

  console.log(`   📍 Zona: ${testCrew.zona}`);
  console.log(`   👥 Miembros: ${Array.isArray(testCrew.members) ? testCrew.members.length : 0}`);
  console.log(`   🆔 ID: ${testCrew.id}`);
  console.log(`   📊 Estado: ${testCrew.state}`);
  console.log(`   🔄 Disponibilidad: ${testCrew.availability}`);
  */
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });

