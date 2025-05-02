import axios from 'axios';
import { Cliente, ClienteResponse } from '../types/cliente';

const API_URL = 'http://localhost:8000/api';

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