import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export interface Cliente {
    id?: number;
    nombre: string;
    apellido: string;
    rut: string;
    telefono: string;
    email: string;
    activo: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ClienteResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Cliente[];
  }
  
  export const getClientes = async (): Promise<ClienteResponse> => {
    try {
      const response = await axios.get(`${API_URL}/clientes/clientes/`);
      return response.data;
    } catch (error) {
      console.error("Error fetching clientes:", error);
      throw error;
    }
  };
  
  export const getCliente = async (id: number): Promise<Cliente> => {
    try {
      const response = await axios.get(`${API_URL}/clientes/clientes/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching cliente ${id}:`, error);
      throw error;
    }
  };
  
  export const createCliente = async (clienteData: Cliente): Promise<Cliente> => {
    try {
      const response = await axios.post(`${API_URL}/clientes/clientes/`, clienteData);
      return response.data;
    } catch (error) {
      console.error("Error creating cliente:", error);
      throw error;
    }
  };
  
  export const updateCliente = async (id: number, clienteData: Cliente): Promise<Cliente> => {
    try {
      const response = await axios.put(`${API_URL}/clientes/clientes/${id}/`, clienteData);
      return response.data;
    } catch (error) {
      console.error(`Error updating cliente ${id}:`, error);
      throw error;
    }
  };
  
  export const deleteCliente = async (id: number): Promise<boolean> => {
    try {
      await axios.delete(`${API_URL}/clientes/clientes/${id}/`);
      return true;
    } catch (error) {
      console.error(`Error deleting cliente ${id}:`, error);
      throw error;
    }
  };