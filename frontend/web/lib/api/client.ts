/**
 * Cliente API
 * Infrastructure layer - Cliente HTTP genérico para comunicarse con los microservicios
 */

import { authService } from '../auth/auth.service';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Callback opcional para obtener el token de autenticación
 * Permite desacoplar el cliente de la implementación específica de auth
 */
export type TokenGetter = () => string | null;

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const tokens = await authService.refreshToken(refreshToken);
        if (tokens?.accessToken) {
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          return tokens.accessToken;
        }
      } catch (error) {
        console.error('[ApiClient] Error refreshing token:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        refreshPromise = null;
      }
      return null;
    })();
  }

  return refreshPromise;
};

export class ApiClient {
  private readonly baseURL: string;
  private readonly getToken?: TokenGetter;

  /**
   * @param baseURL - URL base del microservicio (ej: 'http://localhost:3000/auth')
   * @param getToken - Función opcional para obtener el token JWT
   */
  constructor(baseURL: string, getToken?: TokenGetter) {
    this.baseURL = baseURL.replace(/\/$/, ''); // Remover trailing slash si existe
    this.getToken = getToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Normalizar endpoint (remover leading slash si existe, ya que baseURL lo maneja)
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `${this.baseURL}/${normalizedEndpoint}`;

    // Obtener token si está disponible
    const token = this.getToken?.();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Agregar Authorization header si hay token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Log para debugging - solo en desarrollo
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.warn('[ApiClient] No token found for request to:', url);
      }
    }

    const config: RequestInit = {
      ...options,
      credentials: 'include', // Send cookies automatically
      headers,
    };

    let response = await fetch(url, config);

    if (response.status === 401 && typeof window !== 'undefined') {
      const newToken = await refreshAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, { ...config, headers });
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));
      
      // Si el backend retorna { success: false, error: "..." }
      if (errorData.error) {
        throw new Error(errorData.error);
      }
      // Si retorna { message: "..." }
      if (errorData.message) {
        const nestedMessage =
          typeof errorData.message === 'string'
            ? errorData.message
            : errorData.message?.message || JSON.stringify(errorData.message);
        throw new Error(nestedMessage);
      }
      // Fallback genérico
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Debug log para /clients/pending
    if (url.includes('/clients/pending')) {
      console.log('[ApiClient] /clients/pending - Raw response:', JSON.stringify(result, null, 2));
      console.log('[ApiClient] /clients/pending - Is array?', Array.isArray(result));
      console.log('[ApiClient] /clients/pending - Type:', typeof result);
    }
    
    // PRIORIDAD 0: Manejar formato Result de @aaron/common ({_tag: "ok", value: [...]} o {_tag: "error", error: ...})
    if (result && typeof result === 'object' && '_tag' in result) {
      if (result._tag === 'ok') {
        // Transformar Result.ok a ApiResponse
        return {
          success: true,
          data: result.value as T,
        };
      } else if (result._tag === 'error') {
        // Transformar Result.error a error
        const errorMessage = result.error?.message || result.error || 'Error en la petición';
        throw new Error(errorMessage);
      }
    }
    
    // PRIORIDAD 1: Si es un array directamente, wrappearlo en ApiResponse
    // Esto debe ir ANTES de verificar 'success' porque los arrays también son objetos
    if (Array.isArray(result)) {
      if (url.includes('/clients/pending')) {
        console.log('[ApiClient] /clients/pending - Wrapping array in ApiResponse');
      }
      return {
        success: true,
        data: result as T,
      };
    }
    
    // PRIORIDAD 2: Verificar si la respuesta tiene el formato { success, data }
    if (result && typeof result === 'object' && 'success' in result) {
      if (!result.success) {
        throw new Error(result.error || result.message || 'Error en la petición');
      }
      return result;
    }
    
    // PRIORIDAD 3: Si no tiene el formato esperado pero es un objeto válido, wrappear en ApiResponse
    // Esto maneja casos donde el backend retorna directamente los datos (ej: metrics endpoints)
    if (result && typeof result === 'object' && result !== null) {
      return {
        success: true,
        data: result,
      };
    }
    
    // PRIORIDAD 4: Para otros tipos de respuesta (string, number, null, etc.)
    return {
      success: true,
      data: result,
    };
  }

  get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}
