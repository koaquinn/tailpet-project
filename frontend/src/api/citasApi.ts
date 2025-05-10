// src/api/citasApi.ts (nuevo)
import axiosInstance from './axiosConfig';

export interface Consulta {
  id?: number;
  mascota: number;
  mascota_nombre?: string;
  veterinario: number;
  veterinario_nombre?: string;
  fecha: string;
  motivo: string;
  diagnostico?: string;
  observaciones?: string;
  estado: 'PROGRAMADA' | 'COMPLETADA' | 'CANCELADA';
  tipo: 'RUTINA' | 'EMERGENCIA' | 'SEGUIMIENTO';
  duracion_estimada: number;
}

export interface ConsultaResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Consulta[];
}

const citasApi = {
  getConsultas: async (params?: any): Promise<ConsultaResponse> => {
    const { data } = await axiosInstance.get<ConsultaResponse>('/citas/consultas/', { params });
    return data;
  },

  getConsulta: async (id: number): Promise<Consulta> => {
    const { data } = await axiosInstance.get<Consulta>(`/citas/consultas/${id}/`);
    return data;
  },

  createConsulta: async (consulta: Consulta): Promise<Consulta> => {
    const { data } = await axiosInstance.post<Consulta>('/citas/consultas/', consulta);
    return data;
  },

  updateConsulta: async (id: number, consulta: Partial<Consulta>): Promise<Consulta> => {
    const { data } = await axiosInstance.patch<Consulta>(`/citas/consultas/${id}/`, consulta);
    return data;
  },

  deleteConsulta: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/citas/consultas/${id}/`);
  },

  // Consultas por mascota
  getConsultasByMascota: async (mascotaId: number): Promise<ConsultaResponse> => {
    const { data } = await axiosInstance.get<ConsultaResponse>('/citas/consultas/', {
      params: { mascota: mascotaId }
    });
    return data;
  },

  // Consultas por veterinario
  getConsultasByVeterinario: async (veterinarioId: number): Promise<ConsultaResponse> => {
    const { data } = await axiosInstance.get<ConsultaResponse>('/citas/consultas/', {
      params: { veterinario: veterinarioId }
    });
    return data;
  }
};

export default citasApi;