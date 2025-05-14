// src/api/historialApi.ts (nuevo)
import axiosInstance from './axiosConfig';

export interface HistorialMedico {
  id?: number;
  mascota: number;
  mascota_nombre?: string;
  veterinario: number;
  veterinario_nombre?: string;
  fecha: string;
  observaciones?: string;
}

export interface Consulta {
  id?: number;
  historial: number;
  veterinario: number;
  veterinario_nombre?: string;
  tipo_consulta: number;
  tipo_consulta_nombre?: string;
  fecha: string;
  motivo_consulta: string;
  diagnostico: string;
  observaciones?: string;
}

export interface Tratamiento {
  id?: number;
  historial: number;
  descripcion: string;
  duracion: string;
  inicio_tratamiento: string;
  fin_tratamiento?: string;
  instrucciones: string;
}

export interface Vacuna {
  id?: number;
  nombre: string;
  descripcion?: string;
  tipo: 'OBLIGATORIA' | 'OPCIONAL';
  intervalo_revacunacion: number;
  especie: number;
  especie_nombre?: string;
}

export interface MascotaVacuna {
  id?: number;
  mascota: number;
  mascota_nombre?: string;
  vacuna: number;
  vacuna_nombre?: string;
  fecha_aplicacion: string;
  fecha_proxima?: string;
  veterinario: number;
  veterinario_nombre?: string;
  lote: number;
  observaciones?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const historialApi = {
  // Historial Médico
  getHistorialByMascota: async (mascotaId: number): Promise<HistorialMedico> => {
    const { data } = await axiosInstance.get<HistorialMedico>(`/historial-medico/historiales/?mascota=${mascotaId}`);
    return data;
  },

  createHistorial: async (historial: Partial<HistorialMedico>): Promise<HistorialMedico> => {
    const { data } = await axiosInstance.post<HistorialMedico>('/historial-medico/historiales/', historial);
    return data;
  },

  updateHistorial: async (id: number, historial: Partial<HistorialMedico>): Promise<HistorialMedico> => {
    const { data } = await axiosInstance.patch<HistorialMedico>(`/historial-medico/historiales/${id}/`, historial);
    return data;
  },

  // Consultas en el historial
  getConsultasHistorial: async (historialId: number): Promise<PaginatedResponse<Consulta>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<Consulta>>(`/historial-medico/consultas/?historial=${historialId}`);
    return data;
  },

  getConsulta: async (id: number): Promise<Consulta> => {
    const { data } = await axiosInstance.get<Consulta>(`/historial-medico/consultas/${id}/`);
    return data;
  },

  createConsulta: async (consulta: Partial<Consulta>): Promise<Consulta> => {
    const { data } = await axiosInstance.post<Consulta>('/historial-medico/consultas/', consulta);
    return data;
  },

  updateConsulta: async (id: number, consulta: Partial<Consulta>): Promise<Consulta> => {
    const { data } = await axiosInstance.patch<Consulta>(`/historial-medico/consultas/${id}/`, consulta);
    return data;
  },

  // Tratamientos
  getTratamientosHistorial: async (historialId: number): Promise<PaginatedResponse<Tratamiento>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<Tratamiento>>(`/historial-medico/tratamientos/?historial=${historialId}`);
    return data;
  },

  getTratamiento: async (id: number): Promise<Tratamiento> => {
    const { data } = await axiosInstance.get<Tratamiento>(`/historial-medico/tratamientos/${id}/`);
    return data;
  },

  createTratamiento: async (tratamiento: Partial<Tratamiento>): Promise<Tratamiento> => {
    const { data } = await axiosInstance.post<Tratamiento>('/historial-medico/tratamientos/', tratamiento);
    return data;
  },

  updateTratamiento: async (id: number, tratamiento: Partial<Tratamiento>): Promise<Tratamiento> => {
    const { data } = await axiosInstance.patch<Tratamiento>(`/historial-medico/tratamientos/${id}/`, tratamiento);
    return data;
  },

  // Vacunas
  getVacunas: async (params?: { especie?: number }): Promise<PaginatedResponse<Vacuna>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<Vacuna>>('/historial-medico/vacunas/', { params });
    return data;
  },

  // Vacunaciones (aplicación de vacunas a mascotas)
  getVacunacionesByMascota: async (mascotaId: number): Promise<PaginatedResponse<MascotaVacuna>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<MascotaVacuna>>(`/historial-medico/vacunaciones/?mascota=${mascotaId}`);
    return data;
  },

  createVacunacion: async (vacunacion: Partial<MascotaVacuna>): Promise<MascotaVacuna> => {
    const { data } = await axiosInstance.post<MascotaVacuna>('/historial-medico/vacunaciones/', vacunacion);
    return data;
  }
};

export default historialApi;