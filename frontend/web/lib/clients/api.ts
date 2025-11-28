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
