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
 */
export async function createManualClient(data: CreateManualClientDto): Promise<Client> {
  const result = await opsApi.post<Client>('/clients/manual', data);
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Error al crear cliente manual');
  }
  return result.data;
}
