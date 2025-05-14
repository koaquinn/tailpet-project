import axiosInstance from './axiosConfig';

export interface ConsultaEnCurso {
  id?: number;
  mascota: number;
  mascota_nombre?: string;
  cliente_nombre?: string;
  veterinario: number;
  veterinario_nombre?: string;
  fecha: string;
  motivo: string;
  diagnostico: string;
  observaciones?: string;
  peso_actual?: number;
  temperatura?: number;
  sintomas?: string;
  tratamiento?: string;
  medicamentos?: Array<{
    id: number;
    nombre: string;
    dosis: string;
    frecuencia: string;
    duracion: string;
  }>;
  estado: 'PROGRAMADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA';
  tipo: 'RUTINA' | 'EMERGENCIA' | 'SEGUIMIENTO';
}

// Métodos para manejar la consulta en curso
const consultaApi = {
  // Obtiene los detalles de una consulta
  getConsulta: async (id: number): Promise<ConsultaEnCurso> => {
    const { data } = await axiosInstance.get<ConsultaEnCurso>(`/citas/consultas/${id}/`);
    return data;
  },

  // Inicia una consulta (cambio de estado a EN_CURSO)
  iniciarConsulta: async (id: number): Promise<ConsultaEnCurso> => {
    const { data } = await axiosInstance.patch<ConsultaEnCurso>(`/citas/consultas/${id}/`, {
      estado: 'EN_CURSO'
    });
    return data;
  },

  // Completa una consulta y crea la entrada en historial
  completarConsulta: async (id: number, datosConsulta: Partial<ConsultaEnCurso>): Promise<ConsultaEnCurso> => {
    const { data } = await axiosInstance.patch<ConsultaEnCurso>(
      `/citas/consultas/${id}/completar/`, 
      {
        ...datosConsulta,
        estado: 'COMPLETADA'
      }
    );
    return data;
  },

  // Registra medicamentos recetados durante la consulta
  registrarMedicamentos: async (consultaId: number, medicamentos: any[]): Promise<any> => {
    const { data } = await axiosInstance.post(`/citas/consultas/${consultaId}/medicamentos/`, {
      medicamentos
    });
    return data;
  },
};

export default consultaApi;