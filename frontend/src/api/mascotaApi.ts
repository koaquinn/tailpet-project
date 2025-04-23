// src/api/mascotaApi.ts
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export interface Especie {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface Raza {
  id: number;
  nombre: string;
  especie: number;
  especie_nombre?: string;
  descripcion?: string;
}

export interface Mascota {
  id?: number;
  nombre: string;
  cliente: number;
  cliente_nombre?: string;
  especie: number;
  especie_nombre?: string;
  raza: number;
  raza_nombre?: string;
  fecha_nacimiento: string;
  sexo: 'M' | 'H';
  esterilizado: boolean;
  microchip?: string;
  activo: boolean;
}

export interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getMascotas = async (filters = {}): Promise<ApiResponse<Mascota>> => {
  try {
    const response = await axios.get(`${API_URL}/mascotas/mascotas/`, {
      params: filters
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching mascotas:", error);
    throw error;
  }
};

export const getMascota = async (id: number): Promise<Mascota> => {
  try {
    const response = await axios.get(`${API_URL}/mascotas/mascotas/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching mascota ${id}:`, error);
    throw error;
  }
};

export const getEspecies = async (): Promise<ApiResponse<Especie>> => {
  try {
    const response = await axios.get(`${API_URL}/mascotas/especies/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching especies:", error);
    throw error;
  }
};

export const getRazas = async (especieId?: number): Promise<ApiResponse<Raza>> => {
  try {
    const params = especieId ? { especie: especieId } : {};
    const response = await axios.get(`${API_URL}/mascotas/razas/`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching razas:", error);
    throw error;
  }
};

export const createMascota = async (mascotaData: Mascota): Promise<Mascota> => {
  try {
    const response = await axios.post(`${API_URL}/mascotas/mascotas/`, mascotaData);
    return response.data;
  } catch (error) {
    console.error("Error creating mascota:", error);
    throw error;
  }
};

export const updateMascota = async (id: number, mascotaData: Mascota): Promise<Mascota> => {
  try {
    const response = await axios.put(`${API_URL}/mascotas/mascotas/${id}/`, mascotaData);
    return response.data;
  } catch (error) {
    console.error(`Error updating mascota ${id}:`, error);
    throw error;
  }
};