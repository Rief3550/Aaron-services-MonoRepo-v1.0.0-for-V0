import { opsApi } from '../api/services';
import { EstadoCliente } from '../types/client';

export interface Client {
  id: string;
  userId: string;
  email: string;
  nombreCompleto?: string;
  razonSocial?: string;
  telefono?: string;
  telefonoCelular?: string;
  estado: EstadoCliente;
  lat?: number;
  lng?: number;
  [key: string]: any;
}

export interface UpdateClientStatusParams {
  estado: EstadoCliente;
}

export interface AssignAuditorParams {
  auditorId: string;
  auditorNombre?: string;
}

export interface CreateManualClientDto {
  email: string;
  password?: string;
  fullName: string;
  telefono: string;
  documento: string;
  direccionFacturacion: string;
  lat: number;
  lng: number;
  tipoPropiedad: string;
  tipoConstruccion: string;
  ambientes: number;
  banos: number;
  superficieCubiertaM2: number;
  superficieDescubiertaM2: number;
  barrio: string;
  ciudad: string;
  provincia: string;
  planId: string;
  observaciones?: string;
  observacionesPropiedad?: string;
}

/**
 * Obtiene la lista de clientes
 */
export async function fetchClients(filters?: { estado?: EstadoCliente }): Promise<Client[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.estado) params.append('estado', filters.estado);
    
    const endpoint = params.toString() ? `/clients?${params.toString()}` : '/clients';
    const result = await opsApi.get<Client[]>(endpoint);
    
    if (result.success && result.data) {
      return Array.isArray(result.data) ? result.data : [result.data];
    }
    return [];
  } catch (error) {
    console.error('[fetchClients] Error fetching clients:', error);
    throw error;
  }
}

/**
 * Obtiene un cliente por ID
 */
export async function fetchClientById(clientId: string): Promise<Client> {
  try {
    const result = await opsApi.get<Client>(`/clients/${clientId}`);
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error('Client not found');
  } catch (error) {
    console.error('[fetchClientById] Error fetching client:', error);
    throw error;
  }
}

/**
 * Actualiza el estado de un cliente
 */
export async function updateClientStatus(
  clientId: string,
  params: UpdateClientStatusParams
): Promise<void> {
  try {
    await opsApi.patch(`/clients/${clientId}/status`, params);
  } catch (error) {
    console.error('[updateClientStatus] Error updating client status:', error);
    throw error;
  }
}

/**
 * Asigna un auditor a un cliente
 */
export async function assignAuditor(
  clientId: string,
  params: AssignAuditorParams
): Promise<void> {
  try {
    await opsApi.post(`/clients/${clientId}/assign-auditor`, params);
  } catch (error) {
    console.error('[assignAuditor] Error assigning auditor:', error);
    throw error;
  }
}

/**
 * Crea un cliente manualmente (para operadores)
 * Mapea los campos del frontend al formato esperado por el backend
 */
export async function createManualClient(data: CreateManualClientDto): Promise<Client> {
  // Mapear direccionFacturacion a address (el backend espera 'address')
  const { direccionFacturacion, ...rest } = data;
  const payload = {
    ...rest,
    address: direccionFacturacion, // El backend espera 'address', no 'direccionFacturacion'
  };
  
  const result = await opsApi.post<Client>('/clients/manual', payload);
  if (!result.success || !result.data) {
    // Extraer mensaje de error específico del backend
    let errorMessage = 'Error al crear cliente manual';
    if (result.error) {
      // Si el error es un objeto con message (respuesta del backend)
      if (typeof result.error === 'object' && result.error !== null) {
        const errObj = result.error as any;
        if (errObj.message) {
          errorMessage = Array.isArray(errObj.message) 
            ? errObj.message.join(', ') 
            : String(errObj.message);
        }
      } else {
        errorMessage = String(result.error);
      }
    }
    console.error('[createManualClient] Error:', errorMessage, payload);
    throw new Error(errorMessage);
  }
  return result.data;
}

/**
 * DTO para aprobar y activar un cliente completo
 */
export interface ApproveClientDto {
  // Datos del cliente
  telefono?: string;
  telefonoAlt?: string;
  documento?: string;
  direccionFacturacion?: string;
  provincia?: string;
  ciudad?: string;
  codigoPostal?: string;

  // Datos del inmueble
  propertyAddress?: string;
  propertyLat?: number;
  propertyLng?: number;
  tipoPropiedad?: string;
  tipoConstruccion?: string;
  ambientes?: number;
  banos?: number;
  superficieCubiertaM2?: number;
  superficieDescubiertaM2?: number;
  barrio?: string;
  observacionesPropiedad?: string;

  // Plan y suscripción
  planId: string; // REQUERIDO
  billingDay?: number;
  subscriptionStartDate?: string;

  // Contrato (opcional)
  contractNumber?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  contractNotes?: string;

  // Revisión técnica (opcional)
  technicalReviewDate?: string;
  reviewedBy?: string;
  reviewStatus?: string;
  technicalNotes?: string;

  // Observaciones generales
  observaciones?: string;
}

/**
 * Aprueba y activa un cliente completo (endpoint unificado)
 */
export async function approveClient(
  clientId: string,
  data: ApproveClientDto
): Promise<{
  client: Client;
  property: any;
  subscription: any;
  contract: any;
}> {
  try {
    const result = await opsApi.post<{
      client: Client;
      property: any;
      subscription: any;
      contract: any;
    }>(`/clients/${clientId}/approve`, data);
    
    if (!result.success || !result.data) {
      let errorMessage = 'Error al aprobar cliente';
      if (result.error) {
        if (typeof result.error === 'object' && result.error !== null) {
          const errObj = result.error as any;
          if (errObj.message) {
            errorMessage = Array.isArray(errObj.message) 
              ? errObj.message.join(', ') 
              : String(errObj.message);
          }
        } else {
          errorMessage = String(result.error);
        }
      }
      console.error('[approveClient] Error:', errorMessage, data);
      throw new Error(errorMessage);
    }
    return result.data;
  } catch (error) {
    console.error('[approveClient] Error approving client:', error);
    throw error;
  }
}
