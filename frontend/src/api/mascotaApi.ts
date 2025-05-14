// src/api/mascotaApi.ts
import axiosInstance from './axiosConfig';
import { 
  Mascota, 
  Especie, 
  Raza, 
  MascotaResponse, 
  EspecieResponse, 
  RazaResponse 
} from '../types/mascota';

// Re-exportamos los tipos para mantener compatibilidad
export type { Mascota, Especie, Raza };

// Mascotas
export const getMascotas = async (params?: { 
  page?: number; 
  page_size?: number;
  cliente?: number;
  activo?: boolean;
}): Promise<MascotaResponse> => {
  try {
    const { data } = await axiosInstance.get<MascotaResponse>('/mascotas/mascotas/', { params });
    return data;
  } catch (error) {
    console.error("Error fetching mascotas:", error);
    throw error;
  }
};

export const getClientes = async () => {
  const response = await axiosInstance.get('/clientes/');
  return response.data;
};

export const getMascota = async (id: number): Promise<Mascota> => {
  try {
    const { data } = await axiosInstance.get<Mascota>(`/mascotas/mascotas/${id}/`);
    return data;
  } catch (error) {
    console.error(`Error fetching mascota ${id}:`, error);
    throw error;
  }
};

export const createMascota = async (mascotaData: Mascota): Promise<Mascota> => {
  try {
    const { data } = await axiosInstance.post<Mascota>('/mascotas/mascotas/', mascotaData);
    return data;
  } catch (error) {
    console.error("Error creating mascota:", error);
    throw error;
  }
};

export const updateMascota = async (id: number, mascotaData: Mascota): Promise<Mascota> => {
  try {
    const { data } = await axiosInstance.put<Mascota>(`/mascotas/mascotas/${id}/`, mascotaData);
    return data;
  } catch (error) {
    console.error(`Error updating mascota ${id}:`, error);
    throw error;
  }
};

export const deleteMascota = async (id: number): Promise<boolean> => {
  try {
    await axiosInstance.delete(`/mascotas/mascotas/${id}/`);
    return true;
  } catch (error) {
    console.error(`Error deleting mascota ${id}:`, error);
    throw error;
  }
};

// Especies
export const getEspecies = async (): Promise<EspecieResponse> => {
  try {
    const { data } = await axiosInstance.get<EspecieResponse>('/mascotas/especies/');
    return data;
  } catch (error) {
    console.error("Error fetching especies:", error);
    throw error;
  }
};

export const getEspecie = async (id: number): Promise<Especie> => {
  try {
    const { data } = await axiosInstance.get<Especie>(`/mascotas/especies/${id}/`);
    return data;
  } catch (error) {
    console.error(`Error fetching especie ${id}:`, error);
    throw error;
  }
};

export const createEspecie = async (especieData: Omit<Especie, 'id'>): Promise<Especie> => {
  try {
    const { data } = await axiosInstance.post<Especie>('/mascotas/especies/', especieData);
    return data;
  } catch (error) {
    console.error("Error creating especie:", error);
    throw error;
  }
};

export const getMascotasByCliente = async (clienteId: number): Promise<MascotaResponse> => {
  try {
    const { data } = await axiosInstance.get<MascotaResponse>('/mascotas/mascotas/', {
      params: { cliente: clienteId }
    });
    return data;
  } catch (error) {
    console.error(`Error fetching mascotas for cliente ${clienteId}:`, error);
    throw error;
  }
};

// Razas
export const getRazas = async (especieId?: number): Promise<RazaResponse> => {
  try {
    const params = especieId ? { especie: especieId } : undefined;
    const { data } = await axiosInstance.get<RazaResponse>('/mascotas/razas/', { params });
    return data;
  } catch (error) {
    console.error("Error fetching razas:", error);
    throw error;
  }
};

export const getRaza = async (id: number): Promise<Raza> => {
  try {
    const { data } = await axiosInstance.get<Raza>(`/mascotas/razas/${id}/`);
    return data;
  } catch (error) {
    console.error(`Error fetching raza ${id}:`, error);
    throw error;
  }
};

export const createRaza = async (razaData: Omit<Raza, 'id'>): Promise<Raza> => {
  try {
    const { data } = await axiosInstance.post<Raza>('/mascotas/razas/', razaData);
    return data;
  } catch (error) {
    console.error("Error creating raza:", error);
    throw error;
  }
};

// Fotos de mascotas
export const getFotosMascota = async (mascotaId: number): Promise<any> => {
  try {
    const { data } = await axiosInstance.get('/mascotas/fotos/', {
      params: { mascota: mascotaId }
    });
    return data;
  } catch (error) {
    console.error(`Error fetching fotos for mascota ${mascotaId}:`, error);
    throw error;
  }
};

export const uploadFotoMascota = async (mascotaId: number, fotoFile: File, esPrincipal: boolean = false): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('mascota', mascotaId.toString());
    formData.append('url_foto', fotoFile);
    formData.append('es_principal', esPrincipal.toString());

    const { data } = await axiosInstance.post('/mascotas/fotos/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return data;
  } catch (error) {
    console.error(`Error uploading foto for mascota ${mascotaId}:`, error);
    throw error;
  }
};

// Historial de mascotas
export const getHistorialMascota = async (mascotaId: number): Promise<any> => {
  try {
    const { data } = await axiosInstance.get(`/mascotas/mascotas/${mascotaId}/historial_completo/`);
    return data;
  } catch (error) {
    console.error(`Error fetching historial for mascota ${mascotaId}:`, error);
    throw error;
  }
};

// Registro de pesos
export const getPesosMascota = async (mascotaId: number): Promise<any> => {
  try {
    const { data } = await axiosInstance.get('/mascotas/pesos/', {
      params: { mascota: mascotaId }
    });
    return data;
  } catch (error) {
    console.error(`Error fetching pesos for mascota ${mascotaId}:`, error);
    throw error;
  }
};

export const registrarPesoMascota = async (mascotaId: number, peso: number, fecha: string, notas?: string): Promise<any> => {
  try {
    const { data } = await axiosInstance.post('/mascotas/pesos/', {
      mascota: mascotaId,
      peso,
      fecha_registro: fecha,
      notas
    });
    return data;
  } catch (error) {
    console.error(`Error registering peso for mascota ${mascotaId}:`, error);
    throw error;
  }
};