// src/api/clienteApi.ts
import axiosInstance from './axiosConfig';
import { Cliente, ClienteResponse } from '../types/cliente';
import { Mascota, MascotaResponse } from '../types/mascota';

export const getClientes = async (params?: { page?: number; page_size?: number }): Promise<ClienteResponse> => {
  try {
    const { data } = await axiosInstance.get<ClienteResponse>('/clientes/clientes/', { params });
    return data;
  } catch (error) {
    console.error("Error fetching clientes:", error);
    throw error;
  }
};

export const getCliente = async (id: number): Promise<Cliente> => {
  try {
    const { data } = await axiosInstance.get<Cliente>(`/clientes/clientes/${id}/`);
    return data;
  } catch (error) {
    console.error(`Error fetching cliente ${id}:`, error);
    throw error;
  }
};

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

export const createCliente = async (clienteData: Cliente): Promise<Cliente> => {
  try {
    const { data } = await axiosInstance.post<Cliente>('/clientes/clientes/', clienteData);
    return data;
  } catch (error) {
    console.error("Error creating cliente:", error);
    throw error;
  }
};

export const updateCliente = async (id: number, clienteData: Cliente): Promise<Cliente> => {
  try {
    const { data } = await axiosInstance.put<Cliente>(`/clientes/clientes/${id}/`, clienteData);
    return data;
  } catch (error) {
    console.error(`Error updating cliente ${id}:`, error);
    throw error;
  }
};

export const deleteCliente = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/clientes/clientes/${id}/`);
  } catch (error) {
    console.error(`Error deleting cliente ${id}:`, error);
    throw error;
  }
};

// Funciones para direcciones de clientes
export const getDireccionesCliente = async (clienteId: number): Promise<any> => {
  try {
    const { data } = await axiosInstance.get(`/clientes/direcciones/`, {
      params: { cliente: clienteId }
    });
    return data;
  } catch (error) {
    console.error(`Error fetching direcciones for cliente ${clienteId}:`, error);
    throw error;
  }
};

export const createDireccionCliente = async (direccionData: any): Promise<any> => {
  try {
    const { data } = await axiosInstance.post('/clientes/direcciones/', direccionData);
    return data;
  } catch (error) {
    console.error("Error creating direccion:", error);
    throw error;
  }
};

export const updateDireccionCliente = async (id: number, direccionData: any): Promise<any> => {
  try {
    const { data } = await axiosInstance.put(`/clientes/direcciones/${id}/`, direccionData);
    return data;
  } catch (error) {
    console.error(`Error updating direccion ${id}:`, error);
    throw error;
  }
};

export const deleteDireccionCliente = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/clientes/direcciones/${id}/`);
  } catch (error) {
    console.error(`Error deleting direccion ${id}:`, error);
    throw error;
  }
};