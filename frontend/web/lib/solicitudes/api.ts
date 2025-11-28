import { opsApi } from '../api/services';

export interface Solicitud {
  id: string;
  type: string;
  description: string;
  status: string;
  citizen: string;
  email: string;
  phone?: string;
  address: string;
  createdAt: string;
  clientId: string;
  userId: string;
  lat?: number;
  lng?: number;
  [key: string]: any;
}

/**
 * Obtiene las solicitudes (clientes) con filtro opcional de estado
 * @param estado - Estado del cliente a filtrar (opcional). Si no se proporciona, devuelve todos los estados
 */
export async function fetchSolicitudes(estado?: string): Promise<Solicitud[]> {
  try {
    // Usar el endpoint /clients con filtro de estado
    // Si no se proporciona estado, devolver todos los clientes
    const endpoint = estado 
      ? `/clients?estado=${encodeURIComponent(estado)}`
      : '/clients';
    
    console.log('[fetchSolicitudes] Iniciando petición a', endpoint, 'con estado:', estado || 'TODOS');
    const result = await opsApi.get<any[]>(endpoint);
    
    // Debug: ver qué devuelve la API
    console.log('[fetchSolicitudes] ✅ Raw API result:', JSON.stringify(result, null, 2));
    console.log('[fetchSolicitudes] Result type:', typeof result);
    console.log('[fetchSolicitudes] Is array?', Array.isArray(result));
    console.log('[fetchSolicitudes] Has success?', result && typeof result === 'object' && 'success' in result);
    console.log('[fetchSolicitudes] Has data?', result && typeof result === 'object' && 'data' in result);
    
    // El ApiClient wrappea la respuesta en { success, data }
    // Si el backend devuelve un array directamente, data será el array
    let clients: any[] = [];
    
    // Caso 1: Result viene wrappeado en { success, data }
    if (result && typeof result === 'object' && 'success' in result) {
      console.log('[fetchSolicitudes] ✅ Result tiene formato { success, data }');
      if (!result.success) {
        console.error('[fetchSolicitudes] ❌ API returned error:', result.error);
        return [];
      }
      console.log('[fetchSolicitudes] result.data:', result.data);
      console.log('[fetchSolicitudes] result.data es array?', Array.isArray(result.data));
      clients = Array.isArray(result.data) ? result.data : [];
    }
    // Caso 2: Result es directamente un array (no debería pasar, pero por si acaso)
    else if (Array.isArray(result)) {
      console.log('[fetchSolicitudes] ✅ Result es directamente un array');
      clients = result;
    }
    // Caso 3: Result es undefined o null
    else {
      console.warn('[fetchSolicitudes] ⚠️ Unexpected result format:', result);
      return [];
    }
    
    console.log('[fetchSolicitudes] 📊 Clients found:', clients.length);
    console.log('[fetchSolicitudes] 📋 Clients data:', JSON.stringify(clients, null, 2));
    
    if (clients.length === 0) {
      console.log('[fetchSolicitudes] ⚠️ No hay clientes pendientes');
      return [];
    }

    // Mapear clientes pendientes a formato de solicitud
    const solicitudes = clients.map((client) => {
      // Mapear el estado del cliente al estado de la solicitud
      let status = 'PENDIENTE';
      if (client.estado === 'EN_PROCESO') {
        status = 'EN_REVISION';
      } else if (client.estado === 'ACTIVO') {
        status = 'PROCESADO';
      } else if (client.estado === 'SUSPENDIDO' || client.estado === 'INACTIVO') {
        status = 'RECHAZADA';
      }

      const solicitud: Solicitud = {
        id: client.id || '',
        type: 'Solicitud de Servicio',
        description: 'Solicitud de alta de nuevo suministro y mantenimiento integral.',
        status: status,
        citizen: client.nombreCompleto || client.razonSocial || client.email || 'Sin nombre',
        email: client.email || '',
        phone: client.telefono || client.telefonoCelular || client.telefonoEmergencia || '',
        address: client.direccionFacturacion || 
                 (client.calle ? `${client.calle} ${client.numero || ''} ${client.piso || ''} ${client.departamento || ''}`.trim() : '') ||
                 client.ciudad || 
                 'Sin dirección',
        createdAt: client.createdAt || new Date().toISOString(),
        clientId: client.id || '',
        userId: client.userId || '',
        // Datos completos del cliente para el modal
        client: client,
        // Información adicional
        razonSocial: client.razonSocial,
        documento: client.documento,
        tipoDocumento: client.tipoDocumento,
        cuilCuit: client.cuilCuit,
        localidad: client.localidad,
        provincia: client.provincia,
        codigoPostal: client.codigoPostal,
        // Información de auditoría
        auditorAsignadoId: client.auditorAsignadoId,
        auditorAsignadoNombre: client.auditorAsignadoNombre,
        fechaAsignacionAuditor: client.fechaAsignacionAuditor,
        fechaVisitaAuditoria: client.fechaVisitaAuditoria,
        estadoCliente: client.estado, // Estado real del cliente
        // Ubicación geográfica
        lat: client.lat,
        lng: client.lng,
      };
      console.log('[fetchSolicitudes] 📝 Mapeada solicitud:', solicitud.id, solicitud.citizen, 'Estado:', solicitud.estadoCliente);
      return solicitud;
    });
    
    console.log('[fetchSolicitudes] ✅ Total solicitudes mapeadas:', solicitudes.length);
    return solicitudes;
  } catch (error) {
    console.error('[fetchSolicitudes] ❌ Error fetching solicitudes:', error);
    if (error instanceof Error) {
      console.error('[fetchSolicitudes] Error message:', error.message);
      console.error('[fetchSolicitudes] Error stack:', error.stack);
    }
    throw error;
  }
}

