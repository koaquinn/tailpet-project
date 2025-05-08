// src/api/mascotaApi.ts
import axios from 'axios';
import { 
  Mascota, 
  Especie, 
  Raza, 
  MascotaResponse, 
  EspecieResponse, 
  RazaResponse 
} from '../types/mascota';

const API_URL = 'http://localhost:8000/api';

// Re-exportamos los tipos para mantener compatibilidad con tu código existente
export type { Mascota, Especie, Raza };

// Mascotas
export const getMascotas = async (): Promise<MascotaResponse> => {
  try {
    const response = await axios.get(`${API_URL}/mascotas/mascotas/`);
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

export const deleteMascota = async (id: number): Promise<boolean> => {
  try {
    await axios.delete(`${API_URL}/mascotas/mascotas/${id}/`);
    return true;
  } catch (error) {
    console.error(`Error deleting mascota ${id}:`, error);
    throw error;
  }
};

// Especies
export const getEspecies = async (): Promise<EspecieResponse> => {
  try {
    const response = await axios.get(`${API_URL}/mascotas/especies/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching especies:", error);
    throw error;
  }
};

export const getEspecie = async (id: number): Promise<Especie> => {
  try {
    const response = await axios.get(`${API_URL}/mascotas/especies/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching especie ${id}:`, error);
    throw error;
  }
};

export const getMascotasByCliente = async (clienteId: number): Promise<MascotaResponse> => {
  try {
    const response = await axios.get(`${API_URL}/mascotas/mascotas/?cliente=${clienteId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching mascotas for cliente ${clienteId}:`, error);
    throw error;
  }
};

// Razas
export const getRazas = async (especieId?: number): Promise<RazaResponse> => {
  try {
    const url = especieId 
      ? `${API_URL}/mascotas/razas/?especie=${especieId}` 
      : `${API_URL}/mascotas/razas/`;
      
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching razas:", error);
    throw error;
  }
};

export const getRaza = async (id: number): Promise<Raza> => {
  try {
    const response = await axios.get(`${API_URL}/mascotas/razas/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching raza ${id}:`, error);
    throw error;
  }
};