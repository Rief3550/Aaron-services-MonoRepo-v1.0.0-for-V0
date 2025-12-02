/**
 * Script simplificado para poblar la base de datos con datos de prueba
 * Usa PostgreSQL directamente sin Prisma Client
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// Configuración de la base de datos
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'aaron',
  password: process.env.DB_PASSWORD || 'aaron_password',
};

async function main() {
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    console.log('🔌 Conectado a PostgreSQL\n');
    console.log('🌱 Iniciando seed de datos de prueba...\n');

    const hashedPassword = await bcrypt.hash('test123', 10);

    // 1. Crear usuarios
    console.log('👤 Creando usuarios...');
    await client.query(`
      INSERT INTO auth.users (id, email, password, role, "emailVerified", "fullName", "createdAt", "updatedAt")
      VALUES 
        ('00000000-0000-0000-0000-000000000001', 'admin@test.com', $1, 'ADMIN', true, 'Admin Test', NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000002', 'cliente1@test.com', $1, 'CLIENTE', true, 'Juan Pérez', NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000003', 'cliente2@test.com', $1, 'CLIENTE', true, 'María García', NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000004', 'operador@test.com', $1, 'OPERADOR', true, 'Carlos Operador', NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `, [hashedPassword]);
    console.log('✅ Usuarios creados\n');

    // 2. Crear planes
    console.log('📋 Creando planes...');
    await client.query(`
      INSERT INTO operations.plans (id, name, slug, description, price, "billingCycle", active, features, "createdAt", "updatedAt")
      VALUES 
        ('00000000-0000-0000-0000-000000000011', 'Plan Básico', 'basico', 'Plan básico con servicios esenciales', 5000, 'MENSUAL', true, '{"mantenimientos": 2, "emergencias24h": false, "descuentoServicios": 10}'::jsonb, NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000012', 'Plan Premium', 'premium', 'Plan premium con todos los servicios', 10000, 'MENSUAL', true, '{"mantenimientos": 4, "emergencias24h": true, "descuentoServicios": 20, "prioridadAlta": true}'::jsonb, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ Planes creados\n');

    // 3. Crear clientes
    console.log('👥 Creando clientes...');
    await client.query(`
      INSERT INTO operations.clients (id, "userId", email, "nombreCompleto", telefono, estado, documento, "direccionFacturacion", ciudad, provincia, lat, lng, "createdAt", "updatedAt")
      VALUES 
        ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000002', 'cliente1@test.com', 'Juan Pérez', '+54 11 1234-5678', 'ACTIVO', '12345678', 'Av. Corrientes 1234, CABA', 'Buenos Aires', 'CABA', -34.603722, -58.381592, NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000003', 'cliente2@test.com', 'María García', '+54 11 8765-4321', 'ACTIVO', '87654321', 'Av. Santa Fe 2500, CABA', 'Buenos Aires', 'CABA', -34.595369, -58.399618, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ Clientes creados\n');

    // 4. Crear propiedades
    console.log('🏠 Creando propiedades...');
    await client.query(`
      INSERT INTO operations.customer_properties (id, "clientId", "userId", address, ciudad, provincia, barrio, "tipoPropiedad", "tipoConstruccion", ambientes, banos, "superficieCubiertaM2", lat, lng, status, summary, "createdAt", "updatedAt")
      VALUES 
        ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000002', 'Av. Corrientes 1234, CABA', 'Buenos Aires', 'CABA', 'San Nicolás', 'Departamento', 'Edificio', '3', '2', '75', -34.603722, -58.381592, 'ACTIVE', 'Departamento de 3 ambientes en excelente estado', NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000003', 'Av. Santa Fe 2500, CABA', 'Buenos Aires', 'CABA', 'Recoleta', 'Casa', 'Independiente', '4', '2', '120', -34.595369, -58.399618, 'ACTIVE', 'Casa con jardín y terraza', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ Propiedades creadas\n');

    // 5. Crear suscripciones
    console.log('💳 Creando suscripciones...');
    await client.query(`
      INSERT INTO operations.subscriptions (id, "clientId", "planId", "propertyId", status, "startDate", "currentPeriodStart", "currentPeriodEnd", "createdAt", "updatedAt")
      VALUES 
        ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000031', 'ACTIVE', NOW(), NOW(), NOW() + INTERVAL '30 days', NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000032', 'ACTIVE', NOW(), NOW(), NOW() + INTERVAL '30 days', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ Suscripciones creadas\n');

    // 6. Crear cuadrillas
    console.log('👷 Creando cuadrillas...');
    await client.query(`
      INSERT INTO operations.crews (id, name, zona, type, availability, state, members, progress, lat, lng, "createdAt", "updatedAt")
      VALUES 
        ('00000000-0000-0000-0000-000000000051', 'Cuadrilla A - Plomería', 'CABA', 'crew', 'AVAILABLE', 'desocupado', '[{"name": "Pedro López", "role": "Jefe", "phone": "+54 11 1111-1111"}, {"name": "Luis Martínez", "role": "Ayudante", "phone": "+54 11 2222-2222"}]'::jsonb, 0, -34.603722, -58.381592, NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000052', 'Cuadrilla B - Electricidad', 'CABA', 'crew', 'AVAILABLE', 'desocupado', '[{"name": "Roberto Sánchez", "role": "Jefe", "phone": "+54 11 3333-3333"}, {"name": "Diego Fernández", "role": "Ayudante", "phone": "+54 11 4444-4444"}]'::jsonb, 0, -34.595369, -58.399618, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ Cuadrillas creadas\n');

    // 7. Crear tipos de trabajo
    console.log('🔧 Creando tipos de trabajo...');
    await client.query(`
      INSERT INTO operations.work_types (id, name, category, description, "estimatedDuration", "basePrice", "requiresSpecialist", "createdAt", "updatedAt")
      VALUES 
        ('00000000-0000-0000-0000-000000000061', 'Reparación de cañería', 'plomeria', 'Reparación de cañerías con pérdidas', 120, 5000, false, NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000062', 'Instalación eléctrica', 'electricidad', 'Instalación de nuevos puntos eléctricos', 180, 7500, true, NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000063', 'Mantenimiento preventivo', 'mantenimiento', 'Revisión general de instalaciones', 90, 3000, false, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ Tipos de trabajo creados\n');

    // 8. Crear órdenes de trabajo
    console.log('📋 Creando órdenes de trabajo...');
    await client.query(`
      INSERT INTO operations.work_orders (id, "clientId", "customerId", "propertyId", "subscriptionId", "workTypeId", "crewId", titulo, address, lat, lng, "serviceCategory", description, canal, prioridad, state, "scheduledFor", "createdAt", "updatedAt")
      VALUES 
        ('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000051', 'Reparación urgente - Pérdida de agua', 'Av. Corrientes 1234, CABA', -34.603722, -58.381592, 'plomeria', 'Pérdida de agua en baño principal, requiere atención urgente', 'SUBSCRIPTION', 'ALTA', 'ASIGNADA', NOW() + INTERVAL '2 days', NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000072', '00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000062', '00000000-0000-0000-0000-000000000052', 'Instalación de tomacorrientes', 'Av. Santa Fe 2500, CABA', -34.595369, -58.399618, 'electricidad', 'Instalación de 3 tomacorrientes en dormitorio', 'SUBSCRIPTION', 'NORMAL', 'PROGRAMADA', NOW() + INTERVAL '5 days', NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000073', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000063', NULL, 'Mantenimiento mensual', 'Av. Corrientes 1234, CABA', -34.603722, -58.381592, 'mantenimiento', 'Revisión mensual incluida en plan', 'SUBSCRIPTION', 'BAJA', 'PENDIENTE', NOW() + INTERVAL '7 days', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ Órdenes creadas\n');

    // 9. Crear pagos
    console.log('💰 Creando pagos...');
    await client.query(`
      INSERT INTO operations.payments (id, "subscriptionId", amount, currency, status, "paidAt", note, "createdAt", "updatedAt")
      VALUES 
        ('00000000-0000-0000-0000-000000000081', '00000000-0000-0000-0000-000000000041', 5000, 'ARS', 'COMPLETED', NOW(), 'Pago mensual - Plan Básico', NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000082', '00000000-0000-0000-0000-000000000042', 10000, 'ARS', 'COMPLETED', NOW(), 'Pago mensual - Plan Premium', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ Pagos creados\n');

    console.log('\n✨ ¡Seed completado exitosamente!\n');
    console.log('📊 Resumen de datos creados:');
    console.log('   - 4 usuarios (1 admin, 2 clientes, 1 operador)');
    console.log('   - 2 planes (Básico y Premium)');
    console.log('   - 2 clientes con perfiles completos');
    console.log('   - 2 propiedades');
    console.log('   - 2 suscripciones activas');
    console.log('   - 2 cuadrillas disponibles');
    console.log('   - 3 tipos de trabajo');
    console.log('   - 3 órdenes de trabajo');
    console.log('   - 2 pagos registrados');
    console.log('\n🔑 Credenciales de acceso:');
    console.log('   Admin:     admin@test.com / test123');
    console.log('   Cliente 1: cliente1@test.com / test123');
    console.log('   Cliente 2: cliente2@test.com / test123');
    console.log('   Operador:  operador@test.com / test123');
    console.log('');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
