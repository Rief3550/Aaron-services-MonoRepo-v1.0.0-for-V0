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
  console.log('🌱 Seeding tipos de trabajo básicos...');

  const defaultWorkTypes: Array<{
    nombre: string;
    descripcion: string;
    costoBase: string;
    unidad: string;
  }> = [
    {
      nombre: 'Plomería',
      descripcion: 'Reparaciones de pérdidas de agua, cañerías y sanitarios.',
      costoBase: '15000',
      unidad: 'visita',
    },
    {
      nombre: 'Electricidad',
      descripcion: 'Instalaciones eléctricas, tableros, tomacorrientes y luminarias.',
      costoBase: '18000',
      unidad: 'visita',
    },
    {
      nombre: 'Gas',
      descripcion: 'Reparación y mantenimiento de instalaciones de gas.',
      costoBase: '20000',
      unidad: 'visita',
    },
    {
      nombre: 'Pintura',
      descripcion: 'Pintura interior y exterior, retoques y revestimientos.',
      costoBase: '22000',
      unidad: 'm2',
    },
    {
      nombre: 'Mampostería',
      descripcion: 'Construcción y reparación de paredes, revoques y revestimientos.',
      costoBase: '25000',
      unidad: 'm2',
    },
  ];

  for (const workType of defaultWorkTypes) {
    const existing = await prisma.workType.findFirst({
      where: { nombre: workType.nombre },
    });

    if (existing) {
      await prisma.workType.update({
        where: { id: existing.id },
        data: {
          descripcion: workType.descripcion,
          costoBase: workType.costoBase,
          unidad: workType.unidad,
          activo: true,
        },
      });
      console.log(`✅ Tipo actualizado: ${workType.nombre}`);
    } else {
      await prisma.workType.create({
        data: {
          nombre: workType.nombre,
          descripcion: workType.descripcion,
          costoBase: workType.costoBase,
          unidad: workType.unidad,
        },
      });
      console.log(`✅ Tipo creado: ${workType.nombre}`);
    }
  }

  console.log('✅ Seed completado');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
