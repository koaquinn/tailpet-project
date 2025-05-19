// src/api/clienteApi.ts
import axiosInstance from './axiosConfig';
// Asegúrate que Direccion y DireccionResponse estén definidas correctamente en tus archivos de tipos.
import { Cliente, ClienteResponse, Direccion, DireccionResponse } from '../types/cliente'; 
import { MascotaResponse } from '../types/mascota';

/**
 * Obtiene una lista paginada de clientes.
 * @param params Parámetros de paginación (page, page_size).
 * @returns Promise<ClienteResponse>
 */
export const getClientes = async (params?: { page?: number; page_size?: number }): Promise<ClienteResponse> => {
  try {
    const { data } = await axiosInstance.get<ClienteResponse>('/clientes/clientes/', { params });
    return data;
  } catch (error) {
    console.error("Error fetching clientes:", error);
    throw error; // Relanzar para manejo en el componente
  }
};

/**
 * Obtiene un cliente específico por su ID.
 * @param id ID del cliente.
 * @returns Promise<Cliente>
 */
export const getCliente = async (id: number): Promise<Cliente> => {
  try {
    const { data } = await axiosInstance.get<Cliente>(`/clientes/clientes/${id}/`);
    return data;
  } catch (error) {
    console.error(`Error fetching cliente ${id}:`, error);
    throw error;
  }
};

/**
 * Crea un nuevo cliente.
 * @param clienteData Datos del cliente a crear. Se omite 'id' ya que es asignado por el backend.
 * @returns Promise<Cliente> El cliente creado.
 */
export const createCliente = async (clienteData: Omit<Cliente, 'id'>): Promise<Cliente> => { 
  try {
    const { data } = await axiosInstance.post<Cliente>('/clientes/clientes/', clienteData);
    return data;
  } catch (error) {
    console.error("Error creating cliente:", error);
    throw error;
  }
};

/**
 * Actualiza un cliente existente.
 * @param id ID del cliente a actualizar.
 * @param clienteData Datos del cliente para actualizar. Partial<Cliente> permite actualizar solo algunos campos.
 * @returns Promise<Cliente> El cliente actualizado.
 */
export const updateCliente = async (id: number, clienteData: Partial<Cliente>): Promise<Cliente> => {
  try {
    const { data } = await axiosInstance.put<Cliente>(`/clientes/clientes/${id}/`, clienteData);
    return data;
  } catch (error) {
    console.error(`Error updating cliente ${id}:`, error);
    throw error;
  }
};

/**
 * Elimina un cliente por su ID.
 * @param id ID del cliente a eliminar.
 * @returns Promise<void>
 */
export const deleteCliente = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/clientes/clientes/${id}/`);
  } catch (error) {
    console.error(`Error deleting cliente ${id}:`, error);
    throw error;
  }
};

/**
 * Verifica si un RUT ya existe en la base de datos.
 * @param rut El RUT a verificar.
 * @param currentId (Opcional) ID del cliente actual, para excluirlo de la verificación en modo edición.
 * @returns Promise<{ exists: boolean }>
 */
export const checkRutExists = async (rut: string, currentId?: number): Promise<{ exists: boolean }> => {
  try {
    const params: { rut: string; current_id?: number } = { rut };
    if (currentId) {
      params.current_id = currentId; // El backend debe estar preparado para recibir 'current_id'
    }
    // Asegúrate que el endpoint '/clientes/clientes/verificar-rut/' exista en tu API backend.
    const response = await axiosInstance.get<{ exists: boolean }>(`/clientes/clientes/verificar-rut/`, { params });
    return response.data;
  } catch (error) {
    console.error("Error verificando RUT:", error);
    throw error; // Relanzar para que el componente que llama pueda manejar el error (ej. mostrar mensaje al usuario).
  }
};


// --- Funciones para Mascotas (Relacionadas con Cliente) ---
/**
 * Obtiene las mascotas de un cliente específico.
 * @param clienteId ID del cliente.
 * @param params Parámetros de paginación.
 * @returns Promise<MascotaResponse>
 */
export const getMascotasByCliente = async (clienteId: number, params?: { page?: number; page_size?: number }): Promise<MascotaResponse> => {
  try {
    const { data } = await axiosInstance.get<MascotaResponse>(`/mascotas/mascotas/`, { 
      params: { 
        cliente: clienteId,
        ...params 
      } 
    });
    return data;
  } catch (error) {
    console.error(`Error fetching mascotas for cliente ${clienteId}:`, error);
    throw error;
  }
};


// --- Funciones para Direcciones de Clientes ---

/**
 * Obtiene las direcciones de un cliente específico.
 * @param clienteId ID del cliente.
 * @returns Promise<DireccionResponse> - Asume una respuesta paginada. Si no, sería Promise<Direccion[]>.
 */
export const getDireccionesCliente = async (clienteId: number): Promise<DireccionResponse> => {
  try {
    const { data } = await axiosInstance.get<DireccionResponse>(`/clientes/direcciones/`, {
      params: { cliente: clienteId } // Filtrado por cliente en el backend
    });
    return data;
  } catch (error) {
    console.error(`Error fetching direcciones for cliente ${clienteId}:`, error);
    throw error;
  }
};

/**
 * Crea una nueva dirección para un cliente.
 * @param direccionData Datos de la dirección a crear. Debe incluir `cliente` (ID del cliente).
 * @returns Promise<Direccion> La dirección creada.
 */
export const createDireccionCliente = async (direccionData: Omit<Direccion, 'id'>): Promise<Direccion> => {
  try {
    const { data } = await axiosInstance.post<Direccion>('/clientes/direcciones/', direccionData);
    return data;
  } catch (error) {
    console.error("Error creating direccion:", error);
    throw error;
  }
};

/**
 * Actualiza una dirección existente.
 * @param id ID de la dirección a actualizar.
 * @param direccionData Datos de la dirección para actualizar.
 * @returns Promise<Direccion> La dirección actualizada.
 */
export const updateDireccionCliente = async (id: number, direccionData: Partial<Direccion>): Promise<Direccion> => {
  try {
    const { data } = await axiosInstance.put<Direccion>(`/clientes/direcciones/${id}/`, direccionData);
    return data;
  } catch (error) {
    console.error(`Error updating direccion ${id}:`, error);
    throw error;
  }
};

/**
 * Elimina una dirección por su ID.
 * @param id ID de la dirección a eliminar.
 * @returns Promise<void>
 */
export const deleteDireccionCliente = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/clientes/direcciones/${id}/`);
  } catch (error) {
    console.error(`Error deleting direccion ${id}:`, error);
    throw error;
  }
};
