// src/api/historialApi.ts
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
  // Campos adicionales para capturar los datos clínicos
  temperatura?: number;
  peso?: number;
  sintomas?: string;
  tratamiento?: string;
  cita_relacionada?: number;
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
  lote_codigo?: string;
  medicamento_nombre?: string;
  observaciones?: string;
}

export interface TipoDocumento {
  id?: number;
  nombre: string;
  descripcion?: string;
}

export interface Documento {
  id?: number;
  mascota: number;
  historial?: number;
  tipo_documento: number;
  nombre_archivo: string;
  url_archivo: File | string;
  fecha_subida?: string;
  usuario?: number;
  notas?: string;
}

export interface Receta {
  id?: number;
  mascota: number;
  mascota_nombre?: string;
  veterinario: number;
  veterinario_nombre?: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  observaciones?: string;
  estado: 'ACTIVA' | 'COMPLETADA' | 'CANCELADA';
  detalles?: DetalleReceta[];
}

export interface DetalleReceta {
  id?: number;
  receta: number;
  medicamento: number;
  medicamento_nombre?: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  cantidad: number;
  instrucciones: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const historialApi = {
  // Historial Médico
  getHistorialByMascota: async (mascotaId: number): Promise<PaginatedResponse<HistorialMedico>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<HistorialMedico>>(`/historial-medico/historiales/?mascota=${mascotaId}`);
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

  getVacuna: async (id: number): Promise<Vacuna> => {
    const { data } = await axiosInstance.get<Vacuna>(`/historial-medico/vacunas/${id}/`);
    return data;
  },

  createVacuna: async (vacuna: Partial<Vacuna>): Promise<Vacuna> => {
    const { data } = await axiosInstance.post<Vacuna>('/historial-medico/vacunas/', vacuna);
    return data;
  },

  updateVacuna: async (id: number, vacuna: Partial<Vacuna>): Promise<Vacuna> => {
    const { data } = await axiosInstance.patch<Vacuna>(`/historial-medico/vacunas/${id}/`, vacuna);
    return data;
  },

  // Vacunaciones (aplicación de vacunas a mascotas)
  getVacunacionesByMascota: async (mascotaId: number): Promise<PaginatedResponse<MascotaVacuna>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<MascotaVacuna>>(`/historial-medico/vacunaciones/?mascota=${mascotaId}`);
    return data;
  },

  getVacunacion: async (id: number): Promise<MascotaVacuna> => {
    const { data } = await axiosInstance.get<MascotaVacuna>(`/historial-medico/vacunaciones/${id}/`);
    return data;
  },

  createVacunacion: async (vacunacion: Partial<MascotaVacuna>): Promise<MascotaVacuna> => {
    const { data } = await axiosInstance.post<MascotaVacuna>('/historial-medico/vacunaciones/', vacunacion);
    return data;
  },

  updateVacunacion: async (id: number, vacunacion: Partial<MascotaVacuna>): Promise<MascotaVacuna> => {
    const { data } = await axiosInstance.patch<MascotaVacuna>(`/historial-medico/vacunaciones/${id}/`, vacunacion);
    return data;
  },

  deleteVacunacion: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/historial-medico/vacunaciones/${id}/`);
  },

  // Tipos de Documento
  getTiposDocumento: async (): Promise<PaginatedResponse<TipoDocumento>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<TipoDocumento>>('/historial-medico/tipos-documento/');
    return data;
  },

  // Documentos
  getDocumentosByMascota: async (mascotaId: number): Promise<PaginatedResponse<Documento>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<Documento>>(`/historial-medico/documentos/?mascota=${mascotaId}`);
    return data;
  },

  getDocumento: async (id: number): Promise<Documento> => {
    const { data } = await axiosInstance.get<Documento>(`/historial-medico/documentos/${id}/`);
    return data;
  },

  createDocumento: async (documento: FormData): Promise<Documento> => {
    const { data } = await axiosInstance.post<Documento>('/historial-medico/documentos/', documento, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  updateDocumento: async (id: number, documento: FormData): Promise<Documento> => {
    const { data } = await axiosInstance.patch<Documento>(`/historial-medico/documentos/${id}/`, documento, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  deleteDocumento: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/historial-medico/documentos/${id}/`);
  },

  // Recetas
  getRecetasByMascota: async (mascotaId: number): Promise<PaginatedResponse<Receta>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<Receta>>(`/historial-medico/recetas/?mascota=${mascotaId}`);
    return data;
  },

  getReceta: async (id: number): Promise<Receta> => {
    const { data } = await axiosInstance.get<Receta>(`/historial-medico/recetas/${id}/`);
    return data;
  },

  createReceta: async (receta: Partial<Receta>): Promise<Receta> => {
    const { data } = await axiosInstance.post<Receta>('/historial-medico/recetas/', receta);
    return data;
  },

  updateReceta: async (id: number, receta: Partial<Receta>): Promise<Receta> => {
    const { data } = await axiosInstance.patch<Receta>(`/historial-medico/recetas/${id}/`, receta);
    return data;
  },

  marcarRecetaCompletada: async (id: number): Promise<void> => {
    await axiosInstance.post(`/historial-medico/recetas/${id}/marcar-completada/`);
  }
};

export default historialApi;