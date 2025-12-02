/**
 * Script para poblar la base de datos con datos de prueba
 * Crea: usuarios, clientes, planes, suscripciones, propiedades, cuadrillas, tipos de trabajo y órdenes
 * 
 * Ejecutar desde backend/services/operations-service:
 * node ../../../scripts/seed-test-data.js
 */

const path = require('path');

// Determinar si estamos en el contenedor o localmente
const isDocker = process.env.DOCKER === 'true' || process.cwd().startsWith('/app');
const basePath = isDocker ? '/app' : path.join(__dirname, '..');

const authClientPath = path.join(basePath, 'backend/services/auth-service/node_modules/@prisma/client');
const opsClientPath = path.join(basePath, 'backend/services/operations-service/node_modules/@prisma/client');

let AuthPrisma, OpsPrisma;

try {
  // Intentar cargar desde los servicios
  const { PrismaClient: AuthClient } = require(path.join(basePath, 'backend/services/auth-service/node_modules/@prisma/client'));
  const { PrismaClient: OpsClient } = require(path.join(basePath, 'backend/services/operations-service/node_modules/@prisma/client'));
  AuthPrisma = AuthClient;
  OpsPrisma = OpsClient;
} catch (e) {
  console.error('Error cargando Prisma clients:', e.message);
  console.log('Intentando método alternativo...');
  
  // Método alternativo: usar require.resolve
  try {
    const authPath = require.resolve('@prisma/client', {
      paths: [path.join(basePath, 'backend/services/auth-service')]
    });
    const opsPath = require.resolve('@prisma/client', {
      paths: [path.join(basePath, 'backend/services/operations-service')]
    });
    
    const { PrismaClient: AuthClient } = require(authPath.replace(/index\.js$/, ''));
    const { PrismaClient: OpsClient } = require(opsPath.replace(/index\.js$/, ''));
    AuthPrisma = AuthClient;
    OpsPrisma = OpsClient;
  } catch (e2) {
    console.error('No se pudieron cargar los clientes de Prisma:', e2.message);
    console.log('\n⚠️  Ejecuta primero: pnpm install\n');
    process.exit(1);
  }
}

const bcrypt = require('bcryptjs');

const authPrisma = new AuthPrisma({
  datasources: {
    db: {
      url: process.env.AUTH_DATABASE_URL || 'postgresql://aaron:aaron_password@localhost:5432/postgres?schema=auth'
    }
  }
});

const opsPrisma = new OpsPrisma({
  datasources: {
    db: {
      url: process.env.OPS_DATABASE_URL || 'postgresql://aaron:aaron_password@localhost:5432/postgres?schema=operations'
    }
  }
});

async function main() {
  console.log('🌱 Iniciando seed de datos de prueba...\n');

  try {
    // 1. Crear usuarios de prueba
    console.log('👤 Creando usuarios...');
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const adminUser = await authPrisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: true,
        fullName: 'Admin Test',
      },
    });
    console.log('✅ Admin creado:', adminUser.email);

    const clientUser1 = await authPrisma.user.upsert({
      where: { email: 'cliente1@test.com' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'cliente1@test.com',
        password: hashedPassword,
        role: 'CLIENTE',
        emailVerified: true,
        fullName: 'Juan Pérez',
      },
    });
    console.log('✅ Cliente 1 creado:', clientUser1.email);

    const clientUser2 = await authPrisma.user.upsert({
      where: { email: 'cliente2@test.com' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000003',
        email: 'cliente2@test.com',
        password: hashedPassword,
        role: 'CLIENTE',
        emailVerified: true,
        fullName: 'María García',
      },
    });
    console.log('✅ Cliente 2 creado:', clientUser2.email);

    const operatorUser = await authPrisma.user.upsert({
      where: { email: 'operador@test.com' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000004',
        email: 'operador@test.com',
        password: hashedPassword,
        role: 'OPERADOR',
        emailVerified: true,
        fullName: 'Carlos Operador',
      },
    });
    console.log('✅ Operador creado:', operatorUser.email);

    // 2. Crear planes
    console.log('\n📋 Creando planes...');
    const planBasico = await opsPrisma.plan.upsert({
      where: { id: '00000000-0000-0000-0000-000000000011' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000011',
        name: 'Plan Básico',
        slug: 'basico',
        description: 'Plan básico con servicios esenciales',
        price: 5000,
        billingCycle: 'MENSUAL',
        active: true,
        features: {
          mantenimientos: 2,
          emergencias24h: false,
          descuentoServicios: 10,
        },
      },
    });
    console.log('✅ Plan creado:', planBasico.name);

    const planPremium = await opsPrisma.plan.upsert({
      where: { id: '00000000-0000-0000-0000-000000000012' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000012',
        name: 'Plan Premium',
        slug: 'premium',
        description: 'Plan premium con todos los servicios',
        price: 10000,
        billingCycle: 'MENSUAL',
        active: true,
        features: {
          mantenimientos: 4,
          emergencias24h: true,
          descuentoServicios: 20,
          prioridadAlta: true,
        },
      },
    });
    console.log('✅ Plan creado:', planPremium.name);

    // 3. Crear clientes
    console.log('\n👥 Creando clientes...');
    const client1 = await opsPrisma.client.upsert({
      where: { id: '00000000-0000-0000-0000-000000000021' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000021',
        userId: clientUser1.id,
        email: clientUser1.email,
        nombreCompleto: 'Juan Pérez',
        telefono: '+54 11 1234-5678',
        estado: 'ACTIVO',
        documento: '12345678',
        direccionFacturacion: 'Av. Corrientes 1234, CABA',
        ciudad: 'Buenos Aires',
        provincia: 'CABA',
        lat: -34.603722,
        lng: -58.381592,
      },
    });
    console.log('✅ Cliente creado:', client1.nombreCompleto);

    const client2 = await opsPrisma.client.upsert({
      where: { id: '00000000-0000-0000-0000-000000000022' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000022',
        userId: clientUser2.id,
        email: clientUser2.email,
        nombreCompleto: 'María García',
        telefono: '+54 11 8765-4321',
        estado: 'ACTIVO',
        documento: '87654321',
        direccionFacturacion: 'Av. Santa Fe 2500, CABA',
        ciudad: 'Buenos Aires',
        provincia: 'CABA',
        lat: -34.595369,
        lng: -58.399618,
      },
    });
    console.log('✅ Cliente creado:', client2.nombreCompleto);

    // 4. Crear propiedades
    console.log('\n🏠 Creando propiedades...');
    const property1 = await opsPrisma.customerProperty.upsert({
      where: { id: '00000000-0000-0000-0000-000000000031' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000031',
        clientId: client1.id,
        userId: clientUser1.id,
        address: 'Av. Corrientes 1234, CABA',
        ciudad: 'Buenos Aires',
        provincia: 'CABA',
        barrio: 'San Nicolás',
        tipoPropiedad: 'Departamento',
        tipoConstruccion: 'Edificio',
        ambientes: '3',
        banos: '2',
        superficieCubiertaM2: '75',
        lat: -34.603722,
        lng: -58.381592,
        status: 'ACTIVE',
        summary: 'Departamento de 3 ambientes en excelente estado',
      },
    });
    console.log('✅ Propiedad creada:', property1.address);

    const property2 = await opsPrisma.customerProperty.upsert({
      where: { id: '00000000-0000-0000-0000-000000000032' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000032',
        clientId: client2.id,
        userId: clientUser2.id,
        address: 'Av. Santa Fe 2500, CABA',
        ciudad: 'Buenos Aires',
        provincia: 'CABA',
        barrio: 'Recoleta',
        tipoPropiedad: 'Casa',
        tipoConstruccion: 'Independiente',
        ambientes: '4',
        banos: '2',
        superficieCubiertaM2: '120',
        lat: -34.595369,
        lng: -58.399618,
        status: 'ACTIVE',
        summary: 'Casa con jardín y terraza',
      },
    });
    console.log('✅ Propiedad creada:', property2.address);

    // 5. Crear suscripciones
    console.log('\n💳 Creando suscripciones...');
    const subscription1 = await opsPrisma.subscription.upsert({
      where: { id: '00000000-0000-0000-0000-000000000041' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000041',
        clientId: client1.id,
        planId: planBasico.id,
        propertyId: property1.id,
        status: 'ACTIVE',
        startDate: new Date(),
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 días
      },
    });
    console.log('✅ Suscripción creada para:', client1.nombreCompleto);

    const subscription2 = await opsPrisma.subscription.upsert({
      where: { id: '00000000-0000-0000-0000-000000000042' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000042',
        clientId: client2.id,
        planId: planPremium.id,
        propertyId: property2.id,
        status: 'ACTIVE',
        startDate: new Date(),
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 días
      },
    });
    console.log('✅ Suscripción creada para:', client2.nombreCompleto);

    // 6. Crear cuadrillas
    console.log('\n👷 Creando cuadrillas...');
    const crew1 = await opsPrisma.crew.upsert({
      where: { id: '00000000-0000-0000-0000-000000000051' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000051',
        name: 'Cuadrilla A - Plomería',
        zona: 'CABA',
        type: 'crew',
        availability: 'AVAILABLE',
        state: 'desocupado',
        members: [
          { name: 'Pedro López', role: 'Jefe', phone: '+54 11 1111-1111' },
          { name: 'Luis Martínez', role: 'Ayudante', phone: '+54 11 2222-2222' },
        ],
        progress: 0,
        lat: -34.603722,
        lng: -58.381592,
      },
    });
    console.log('✅ Cuadrilla creada:', crew1.name);

    const crew2 = await opsPrisma.crew.upsert({
      where: { id: '00000000-0000-0000-0000-000000000052' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000052',
        name: 'Cuadrilla B - Electricidad',
        zona: 'CABA',
        type: 'crew',
        availability: 'AVAILABLE',
        state: 'desocupado',
        members: [
          { name: 'Roberto Sánchez', role: 'Jefe', phone: '+54 11 3333-3333' },
          { name: 'Diego Fernández', role: 'Ayudante', phone: '+54 11 4444-4444' },
        ],
        progress: 0,
        lat: -34.595369,
        lng: -58.399618,
      },
    });
    console.log('✅ Cuadrilla creada:', crew2.name);

    // 7. Crear tipos de trabajo
    console.log('\n🔧 Creando tipos de trabajo...');
    const workType1 = await opsPrisma.workType.upsert({
      where: { id: '00000000-0000-0000-0000-000000000061' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000061',
        name: 'Reparación de cañería',
        category: 'plomeria',
        description: 'Reparación de cañerías con pérdidas',
        estimatedDuration: 120, // minutos
        basePrice: 5000,
        requiresSpecialist: false,
      },
    });
    console.log('✅ Tipo de trabajo creado:', workType1.name);

    const workType2 = await opsPrisma.workType.upsert({
      where: { id: '00000000-0000-0000-0000-000000000062' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000062',
        name: 'Instalación eléctrica',
        category: 'electricidad',
        description: 'Instalación de nuevos puntos eléctricos',
        estimatedDuration: 180, // minutos
        basePrice: 7500,
        requiresSpecialist: true,
      },
    });
    console.log('✅ Tipo de trabajo creado:', workType2.name);

    const workType3 = await opsPrisma.workType.upsert({
      where: { id: '00000000-0000-0000-0000-000000000063' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000063',
        name: 'Mantenimiento preventivo',
        category: 'mantenimiento',
        description: 'Revisión general de instalaciones',
        estimatedDuration: 90, // minutos
        basePrice: 3000,
        requiresSpecialist: false,
      },
    });
    console.log('✅ Tipo de trabajo creado:', workType3.name);

    // 8. Crear órdenes de trabajo
    console.log('\n📋 Creando órdenes de trabajo...');
    const workOrder1 = await opsPrisma.workOrder.upsert({
      where: { id: '00000000-0000-0000-0000-000000000071' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000071',
        clientId: client1.id,
        customerId: client1.userId,
        propertyId: property1.id,
        subscriptionId: subscription1.id,
        workTypeId: workType1.id,
        crewId: crew1.id,
        titulo: 'Reparación urgente - Pérdida de agua',
        address: property1.address,
        lat: property1.lat,
        lng: property1.lng,
        serviceCategory: 'plomeria',
        description: 'Pérdida de agua en baño principal, requiere atención urgente',
        canal: 'SUBSCRIPTION',
        prioridad: 'ALTA',
        state: 'ASIGNADA',
        scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // +2 días
      },
    });
    console.log('✅ Orden creada:', workOrder1.titulo);

    const workOrder2 = await opsPrisma.workOrder.upsert({
      where: { id: '00000000-0000-0000-0000-000000000072' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000072',
        clientId: client2.id,
        customerId: client2.userId,
        propertyId: property2.id,
        subscriptionId: subscription2.id,
        workTypeId: workType2.id,
        crewId: crew2.id,
        titulo: 'Instalación de tomacorrientes',
        address: property2.address,
        lat: property2.lat,
        lng: property2.lng,
        serviceCategory: 'electricidad',
        description: 'Instalación de 3 tomacorrientes en dormitorio',
        canal: 'SUBSCRIPTION',
        prioridad: 'NORMAL',
        state: 'PROGRAMADA',
        scheduledFor: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // +5 días
      },
    });
    console.log('✅ Orden creada:', workOrder2.titulo);

    const workOrder3 = await opsPrisma.workOrder.upsert({
      where: { id: '00000000-0000-0000-0000-000000000073' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000073',
        clientId: client1.id,
        customerId: client1.userId,
        propertyId: property1.id,
        subscriptionId: subscription1.id,
        workTypeId: workType3.id,
        titulo: 'Mantenimiento mensual',
        address: property1.address,
        lat: property1.lat,
        lng: property1.lng,
        serviceCategory: 'mantenimiento',
        description: 'Revisión mensual incluida en plan',
        canal: 'SUBSCRIPTION',
        prioridad: 'BAJA',
        state: 'PENDIENTE',
        scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 días
      },
    });
    console.log('✅ Orden creada:', workOrder3.titulo);

    // 9. Crear algunos pagos
    console.log('\n💰 Creando pagos...');
    const payment1 = await opsPrisma.payment.upsert({
      where: { id: '00000000-0000-0000-0000-000000000081' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000081',
        subscriptionId: subscription1.id,
        amount: planBasico.price,
        currency: 'ARS',
        status: 'COMPLETED',
        paidAt: new Date(),
        note: 'Pago mensual - Plan Básico',
      },
    });
    console.log('✅ Pago creado:', payment1.amount, 'ARS');

    const payment2 = await opsPrisma.payment.upsert({
      where: { id: '00000000-0000-0000-0000-000000000082' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000082',
        subscriptionId: subscription2.id,
        amount: planPremium.price,
        currency: 'ARS',
        status: 'COMPLETED',
        paidAt: new Date(),
        note: 'Pago mensual - Plan Premium',
      },
    });
    console.log('✅ Pago creado:', payment2.amount, 'ARS');

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

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await authPrisma.$disconnect();
    await opsPrisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
