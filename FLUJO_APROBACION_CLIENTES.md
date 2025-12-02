# 🔄 Flujo de Aprobación de Clientes - Sistema Completo

## 📝 Lo que FALTA (Backend)

Tienes que implementar en el backend NestJS (todo está documentado en este archivo):

- Modificar `auth.service.ts` → Crear Client **PENDIENTE** en registro
- Crear entidades **Property**, **Contract**, **TechnicalReview**
- Crear endpoint `GET /admin/clients/pending` (lista)
- Crear endpoint `POST /admin/clients/:id/approve` (formulario completo)
- Crear **ActiveClientGuard** y aplicarlo a work-orders
- Implementar email de activación
- Crear panel en back office para aprobar clientes

Todo el código está en este documento: solo tienes que copiarlo y adaptarlo a tu backend.

---

## 📋 Descripción del Flujo

Cuando un usuario se registra en la app, **NO puede operar inmediatamente**. Debe pasar por un proceso de aprobación en el back office donde se completan todos sus datos antes de activar su cuenta.

---

## 🎯 Estados del Cliente

```typescript
enum ClientState {
  PENDIENTE = 'PENDIENTE',    // Recién registrado, esperando aprobación
  ACTIVO = 'ACTIVO',          // Aprobado y puede operar normalmente
  SUSPENDIDO = 'SUSPENDIDO',  // Cuenta suspendida temporalmente
  INACTIVO = 'INACTIVO'       // Cuenta desactivada
}
```

---

## 🔄 Proceso Completo

### 1️⃣ **Usuario se Registra desde la App**

**Vista:** `sign_up_view.dart`

```dart
// Usuario completa:
- Nombre completo
- Email
- Password
- Ubicación (lat/lng opcional)
```

**Backend recibe:** `POST /auth/signup`
```json
{
  "email": "cliente@example.com",
  "password": "******",
  "fullName": "Juan Pérez",
  "lat": -34.6037,
  "lng": -58.3816
}
```

### 2️⃣ **Backend Crea Registro PENDIENTE**

**Archivo:** `src/auth/auth.service.ts`

```typescript
async register(registerDto: RegisterDto) {
  // 1. Crear usuario en tabla users
  const user = await this.usersRepository.save({
    email: registerDto.email,
    password: await bcrypt.hash(registerDto.password, 10),
    fullName: registerDto.fullName,
    role: 'CUSTOMER',
    isEmailVerified: false,
    createdAt: new Date(),
  });

  // 2. ✅ Crear cliente con estado PENDIENTE
  await this.clientsRepository.save({
    id: user.id,
    email: user.email,
    nombreCompleto: registerDto.fullName,
    estado: 'PENDIENTE', // ⚠️ PENDIENTE hasta aprobación
    telefono: null,
    documento: null,
    direccionFacturacion: null,
    lat: registerDto.lat,
    lng: registerDto.lng,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 3. ✅ Crear suscripción en estado PENDIENTE
  await this.subscriptionsRepository.save({
    clientId: user.id,
    planId: null, // Se asignará en back office
    status: 'PENDIENTE',
    currentPeriodStart: null,
    currentPeriodEnd: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 4. Enviar email de verificación
  await this.emailService.sendVerificationEmail(user.email);

  return user;
}
```

### 3️⃣ **App Muestra Mensaje de Pendiente**

Después del registro exitoso y verificación de email, cuando el usuario inicia sesión:

**Vista:** `home_view.dart` o crear `pending_approval_view.dart`

```dart
// Si client.estado == 'PENDIENTE'
Widget _buildPendingApprovalBanner() {
  return Container(
    margin: EdgeInsets.all(16),
    padding: EdgeInsets.all(20),
    decoration: BoxDecoration(
      color: Colors.orange[50],
      border: Border.all(color: Colors.orange, width: 2),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Column(
      children: [
        Icon(Icons.pending_actions, size: 48, color: Colors.orange),
        SizedBox(height: 16),
        Text(
          '⏳ Solicitud en Proceso',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.orange[900],
          ),
          textAlign: TextAlign.center,
        ),
        SizedBox(height: 12),
        Text(
          'Tu solicitud está siendo revisada por nuestro equipo.\n\n'
          'Recibirás un email cuando tu cuenta sea activada y puedas comenzar a solicitar servicios.',
          style: TextStyle(fontSize: 16, color: Colors.black87),
          textAlign: TextAlign.center,
        ),
        SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: () => _refreshClientStatus(),
          icon: Icon(Icons.refresh),
          label: Text('Verificar Estado'),
        ),
      ],
    ),
  );
}
```

### 4️⃣ **Panel Back Office - Solicitudes Pendientes**

**Nueva Vista:** `admin/clients/pending-approvals.component.ts`

```typescript
interface PendingClient {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono?: string;
  lat?: number;
  lng?: number;
  registeredAt: Date;
}

// GET /admin/clients/pending
async getPendingClients(): Promise<PendingClient[]> {
  return this.clientsRepository.find({
    where: { estado: 'PENDIENTE' },
    order: { createdAt: 'DESC' }
  });
}
```

**Vista de Lista:**
```
┌─────────────────────────────────────────────────┐
│  📋 SOLICITUDES PENDIENTES (5)                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  🔴 Juan Pérez                                  │
│  📧 juan@example.com                            │
│  📅 Registrado hace 2 días                      │
│  [APROBAR] [RECHAZAR]                          │
│                                                 │
├─────────────────────────────────────────────────┤
│  🔴 María González                              │
│  📧 maria@example.com                           │
│  📅 Registrado hace 1 día                       │
│  [APROBAR] [RECHAZAR]                          │
└─────────────────────────────────────────────────┘
```

### 5️⃣ **Formulario de Aprobación Completo**

**Vista:** `admin/clients/approve-client-form.component.ts`

Cuando el admin hace clic en **[APROBAR]**, se abre formulario:

```typescript
interface ApprovalData {
  // 📱 Datos personales
  telefono: string;           // Requerido
  documento: string;          // DNI/CUIT requerido
  direccionFacturacion: string;

  // 🏠 Datos del inmueble (Property)
  propertyAddress: string;    // Requerido
  propertyLat: number;        // Requerido
  propertyLng: number;        // Requerido
  propertyType: 'CASA' | 'DEPARTAMENTO' | 'OFICINA' | 'LOCAL';
  propertySize?: number;      // m² opcional
  propertyNotes?: string;     // Notas adicionales

  // 💳 Plan y Suscripción
  planId: string;             // Requerido: Seleccionar plan
  subscriptionStartDate: Date;
  billingDay: number;         // Día de cobro (1-28)

  // 📄 Contrato
  contractNumber: string;     // Auto-generado o manual
  contractStartDate: Date;
  contractEndDate?: Date;     // Opcional si es indefinido
  contractNotes?: string;

  // 🔧 Revisión Técnica
  technicalReviewDate: Date;  // Fecha de inspección
  technicalNotes?: string;    // Observaciones del técnico
  reviewedBy: string;         // ID del técnico que revisó
  reviewStatus: 'APROBADO' | 'REQUIERE_TRABAJO' | 'RECHAZADO';
}
```

**Endpoint de Aprobación:**
```typescript
// POST /admin/clients/:id/approve
async approveClient(clientId: string, approvalData: ApprovalData) {
  return this.dataSource.transaction(async (manager) => {
    // 1. Actualizar cliente a ACTIVO
    await manager.update(Client, clientId, {
      estado: 'ACTIVO',
      telefono: approvalData.telefono,
      documento: approvalData.documento,
      direccionFacturacion: approvalData.direccionFacturacion,
      updatedAt: new Date(),
    });

    // 2. Crear Property (inmueble)
    const property = await manager.save(Property, {
      clientId: clientId,
      address: approvalData.propertyAddress,
      lat: approvalData.propertyLat,
      lng: approvalData.propertyLng,
      type: approvalData.propertyType,
      size: approvalData.propertySize,
      notes: approvalData.propertyNotes,
      isActive: true,
      createdAt: new Date(),
    });

    // 3. Actualizar Suscripción con plan real
    await manager.update(Subscription, { clientId }, {
      planId: approvalData.planId,
      status: 'ACTIVA',
      propertyId: property.id,
      currentPeriodStart: approvalData.subscriptionStartDate,
      currentPeriodEnd: this.calculatePeriodEnd(approvalData.subscriptionStartDate),
      billingDay: approvalData.billingDay,
      updatedAt: new Date(),
    });

    // 4. Crear Contrato
    await manager.save(Contract, {
      clientId: clientId,
      contractNumber: approvalData.contractNumber,
      startDate: approvalData.contractStartDate,
      endDate: approvalData.contractEndDate,
      notes: approvalData.contractNotes,
      status: 'VIGENTE',
      createdAt: new Date(),
    });

    // 5. Registrar Revisión Técnica
    await manager.save(TechnicalReview, {
      propertyId: property.id,
      reviewDate: approvalData.technicalReviewDate,
      reviewedBy: approvalData.reviewedBy,
      status: approvalData.reviewStatus,
      notes: approvalData.technicalNotes,
      createdAt: new Date(),
    });

    // 6. 📧 Enviar email de activación
    const client = await manager.findOne(Client, { where: { id: clientId } });
    await this.emailService.sendActivationEmail(client.email, {
      nombreCompleto: client.nombreCompleto,
      planName: (await manager.findOne(Plan, approvalData.planId)).name,
      propertyAddress: approvalData.propertyAddress,
    });

    return { success: true, message: 'Cliente activado exitosamente' };
  });
}
```

### 6️⃣ **Email de Activación**

**Template:** `templates/client-activated.html`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>¡Tu cuenta ha sido activada!</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">✅ ¡Cuenta Activada!</h1>
  </div>
  
  <div style="padding: 30px; background: #f9f9f9;">
    <h2>¡Bienvenido {{nombreCompleto}}!</h2>
    
    <p style="font-size: 16px; line-height: 1.6;">
      Tu solicitud ha sido aprobada y tu cuenta ya está <strong>activa</strong>.
    </p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>📋 Detalles de tu suscripción:</h3>
      <ul style="list-style: none; padding: 0;">
        <li>💳 <strong>Plan:</strong> {{planName}}</li>
        <li>🏠 <strong>Propiedad:</strong> {{propertyAddress}}</li>
        <li>📅 <strong>Inicio:</strong> {{subscriptionStartDate}}</li>
      </ul>
    </div>
    
    <p style="font-size: 16px;">
      Ya puedes comenzar a <strong>solicitar servicios</strong> desde la aplicación móvil.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appDeepLink}}" style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
        Abrir App
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px;">
      Si tienes alguna consulta, contáctanos en {{supportEmail}}
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    © {{year}} Aaron Services. Todos los derechos reservados.
  </div>
</body>
</html>
```

**Servicio de Email:**
```typescript
async sendActivationEmail(email: string, data: ActivationEmailData) {
  await this.mailer.send({
    to: email,
    subject: '🎉 ¡Tu cuenta Aaron Services ha sido activada!',
    template: 'client-activated',
    context: {
      nombreCompleto: data.nombreCompleto,
      planName: data.planName,
      propertyAddress: data.propertyAddress,
      subscriptionStartDate: formatDate(data.subscriptionStartDate),
      appDeepLink: 'aaronservices://home',
      supportEmail: 'soporte@aaronservices.com',
      year: new Date().getFullYear(),
    },
  });
}
```

### 7️⃣ **Validación en App - Bloquear Servicios**

**Middleware/Guard en Backend:**

```typescript
// src/common/guards/active-client.guard.ts
@Injectable()
export class ActiveClientGuard implements CanActivate {
  constructor(
    @InjectRepository(Client)
    private clientRepo: Repository<Client>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.id;

    const client = await this.clientRepo.findOne({
      where: { id: userId },
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (client.estado !== 'ACTIVO') {
      throw new ForbiddenException(
        'Tu cuenta está pendiente de aprobación. Recibirás un email cuando puedas operar.',
      );
    }

    return true;
  }
}
```

**Aplicar Guard a Endpoints de Órdenes:**

```typescript
@Controller('ops/work-orders')
@UseGuards(JwtAuthGuard, ActiveClientGuard) // ⚠️ Guard nuevo
export class WorkOrdersController {
  
  @Post()
  async createWorkOrder(@Request() req, @Body() dto: CreateWorkOrderDto) {
    // Solo llega aquí si el cliente está ACTIVO
    return this.workOrdersService.create(req.user.id, dto);
  }
}
```

**En la App (Flutter):**

```dart
// lib/features/orders/presentation/views/new_order_view.dart
@override
void initState() {
  super.initState();
  _checkClientStatus();
}

Future<void> _checkClientStatus() async {
  try {
    final client = await getIt<ClientService>().getMyProfile();
    
    if (client.estado != 'ACTIVO') {
      if (mounted) {
        _showPendingAccountDialog();
      }
    }
  } catch (e) {
    // Manejar error
  }
}

void _showPendingAccountDialog() {
  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (context) => AlertDialog(
      title: Row(
        children: [
          Icon(Icons.pending_actions, color: Colors.orange),
          SizedBox(width: 12),
          Text('Cuenta Pendiente'),
        ],
      ),
      content: Text(
        'Tu solicitud está siendo revisada por nuestro equipo.\n\n'
        'Recibirás un email cuando puedas comenzar a solicitar servicios.',
        style: TextStyle(fontSize: 16),
      ),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.of(context).pop();
            context.go('/home'); // Volver al home
          },
          child: Text('Entendido'),
        ),
      ],
    ),
  );
}
```

---

## 📊 Nuevas Entidades Backend

### 🏠 **Property (Inmueble)**

```typescript
@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clientId: string;

  @Column()
  address: string;

  @Column('decimal', { precision: 10, scale: 7 })
  lat: number;

  @Column('decimal', { precision: 10, scale: 7 })
  lng: number;

  @Column({
    type: 'enum',
    enum: ['CASA', 'DEPARTAMENTO', 'OFICINA', 'LOCAL'],
  })
  type: string;

  @Column({ nullable: true })
  size?: number; // m²

  @Column('text', { nullable: true })
  notes?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Client, client => client.properties)
  client: Client;
}
```

### 📄 **Contract (Contrato)**

```typescript
@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clientId: string;

  @Column({ unique: true })
  contractNumber: string;

  @Column()
  startDate: Date;

  @Column({ nullable: true })
  endDate?: Date;

  @Column({
    type: 'enum',
    enum: ['VIGENTE', 'VENCIDO', 'CANCELADO'],
    default: 'VIGENTE',
  })
  status: string;

  @Column('text', { nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Client)
  client: Client;
}
```

### 🔧 **TechnicalReview (Revisión Técnica)**

```typescript
@Entity('technical_reviews')
export class TechnicalReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  propertyId: string;

  @Column()
  reviewDate: Date;

  @Column()
  reviewedBy: string; // User ID del técnico

  @Column({
    type: 'enum',
    enum: ['APROBADO', 'REQUIERE_TRABAJO', 'RECHAZADO'],
  })
  status: string;

  @Column('text', { nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Property)
  property: Property;

  @ManyToOne(() => User)
  reviewer: User;
}
```

---

## 🔄 Resumen del Flujo

```
1. Usuario → Registro (SignUp)
           ↓
2. Backend → Crear User + Client (PENDIENTE) + Subscription (PENDIENTE)
           ↓
3. App → Mensaje: "Solicitud en proceso, recibirás email"
           ↓
4. Admin Back Office → Ver lista de pendientes
           ↓
5. Admin → Completar formulario:
           - Teléfono, Documento
           - Datos de inmueble (dirección, lat/lng, tipo)
           - Seleccionar Plan
           - Crear Contrato
           - Registrar Revisión Técnica
           ↓
6. Backend → Actualizar:
           - Client estado → ACTIVO
           - Crear Property
           - Actualizar Subscription → ACTIVA con planId
           - Crear Contract
           - Crear TechnicalReview
           - 📧 Enviar email de activación
           ↓
7. Cliente → Recibe email "¡Cuenta activada!"
           ↓
8. Cliente → Abre app y puede solicitar servicios
           ↓
9. Backend → Guard valida estado ACTIVO antes de crear órdenes
```

---

## ✅ Checklist de Implementación

### Backend (NestJS)

- [ ] Modificar `auth.service.ts` → Crear Client PENDIENTE en registro
- [ ] Crear entidad `Property`
- [ ] Crear entidad `Contract`
- [ ] Crear entidad `TechnicalReview`
- [ ] Crear `ActiveClientGuard`
- [ ] Aplicar guard a endpoints de work-orders
- [ ] Crear endpoint `GET /admin/clients/pending`
- [ ] Crear endpoint `POST /admin/clients/:id/approve`
- [ ] Crear template de email `client-activated.html`
- [ ] Implementar `sendActivationEmail()`

### App (Flutter)

- [ ] Crear `pending_approval_view.dart` o banner en home
- [ ] Agregar validación de estado en `new_order_view.dart`
- [ ] Mostrar dialog si estado != ACTIVO
- [ ] Actualizar `client_model.dart` con nuevos campos si necesario
- [ ] Agregar refresh button para verificar estado

### Back Office (Admin Panel)

- [ ] Crear vista `pending-approvals.component.ts`
- [ ] Crear formulario `approve-client-form.component.ts`
- [ ] Integrar mapa para seleccionar ubicación de inmueble
- [ ] Selector de planes disponibles
- [ ] Form fields para contrato y revisión técnica

---

## 🎓 Notas Importantes

1. **Usuario NO puede operar hasta ser ACTIVO**: El guard `ActiveClientGuard` bloquea cualquier intento de crear órdenes
2. **Email de activación es crucial**: Es la única forma en que el cliente sabe que ya puede usar la app
3. **Datos modificables**: Todos los datos del formulario de aprobación pueden editarse después en perfil del cliente
4. **Revisión técnica**: Permite rechazar si la propiedad no cumple requisitos (ej: instalación eléctrica deficiente)
5. **Contrato**: Base legal del servicio, puede tener fecha de vencimiento o ser indefinido

---

## 🚀 Próximos Pasos

1. Implementar cambios en backend primero
2. Crear panel de aprobación en back office
3. Ajustar app para mostrar estado pendiente
4. Probar flujo completo end-to-end
5. Configurar servicio de emails (SendGrid, AWS SES, etc.)

---

## 🗺️ Datos actuales en tabla `clients`

Observación: actualmente todas las filas comparten las mismas coordenadas (últimas columnas) salvo excepciones. Ejemplo del dataset entregado:

```
d0bf928f-0ff6-4af4-9158-243e36df8bff,,2b5f6d16-e7dc-4a30-9b5b-dc9cb16aa290,INDIVIDUAL,Cliente Test,,,,,,,,false,,test.cliente@example.com,,,,,,,,,,,,,,,,,,,,,,,,,,PENDIENTE,,2025-11-28 11:55:41.304,2025-11-28 17:11:42.509,,,,,,
fa89c900-0a7e-418f-911c-7918ea20644b,,3ff17c39-98fb-4d72-8b6a-60f951dc3fd9,INDIVIDUAL,Federico Riera,,,,,,,,false,,fede.riera7@gmail.com,,,,,,,,,,,,,,,,,,,,,,,,,,PENDIENTE,,2025-11-28 17:13:31.329,2025-11-28 17:13:31.329,,,,,-29.40866,-66.858431
46945dfa-143b-4a7e-b97b-5efe82b10ac4,,66387515-341d-472a-806a-1f95e507bf08,INDIVIDUAL,Federico Riera,,12345678,,,,,,false,,fede.riera7@gmail.com,+543804123456,,,,,,,,,,,,,,,,,,,,,,,,,ACTIVO,,2025-11-28 17:44:31.971,2025-11-28 17:44:31.971,,,,,-29.40866,-66.858431
ec699376-6928-46d0-9d83-35e6eefc4887,,c9b2bbe6-7dbc-4b46-983f-8136bcf89853,INDIVIDUAL,Federico Riera,,,,,,,,false,,federiera52@gmail.com,,,,,,,,,,,,,,,,,,,,,,,,,,ACTIVO,,2025-12-01 18:01:11.682,2025-12-02 15:48:41.992,,,,2025-12-02 15:48:28.564,-29.40866,-66.858431
```

Estas coordenadas deben actualizarse cuando el operador ingrese la ubicación real del inmueble durante la aprobación del cliente.
