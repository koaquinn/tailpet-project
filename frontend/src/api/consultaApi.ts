import axiosInstance from './axiosConfig'; // Tu instancia configurada de Axios

// Interfaz para la respuesta esperada de la receta completa
// Ajústala según lo que realmente devuelva tu backend
export interface MedicamentoRecetaDetalle {
  id: number | string; // Podría ser el ID del DetalleReceta
  medicamento_id_inventario?: number; // ID del medicamento en el inventario
  nombre?: string;
  dosis?: string;
  frecuencia?: string;
  duracion?: string;
  cantidad?: number;
  instrucciones?: string;
}

export interface RecetaCompletaResponse {
  id_receta: number | null;
  fecha_emision: string | null;
  observaciones_receta?: string;
  medicamentos: MedicamentoRecetaDetalle[];
  message?: string; // Para mensajes como "No se encontró receta..."
}


// Interfaz existente (la mantengo como referencia, ajústala si es necesario)
export interface ConsultaEnCurso {
  id?: number;
  mascota: number;
  mascota_nombre?: string;
  cliente_nombre?: string;
  veterinario: number; // Asumo que este es el ID del veterinario
  veterinario_nombre?: string;
  fecha: string; // Formato YYYY-MM-DDTHH:mm:ssZ o similar que el backend entienda/devuelva
  motivo: string;
  diagnostico: string; // Puede ser string | null si es opcional al inicio
  observaciones?: string;
  peso_actual?: number | string | null; // string para el input, number para el backend
  temperatura?: number | string | null; // string para el input, number para el backend
  sintomas?: string;
  tratamiento?: string; // Descripción general del tratamiento
  medicamentos?: Array<{ // Esto parece ser para cargar medicamentos EN la consulta, no la receta final
    id: number;
    nombre: string;
    dosis: string;
    frecuencia: string;
    duracion: string;
    // cantidad?: number; // Si este campo viene de la consulta principal
  }>;
  estado: 'PROGRAMADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA' | string; // string para flexibilidad
  tipo?: 'RUTINA' | 'EMERGENCIA' | 'SEGUIMIENTO' | string; // string para flexibilidad
}


const consultaApi = {
  // Obtiene los detalles de una consulta
  getConsulta: async (id: number): Promise<ConsultaEnCurso> => {
    const { data } = await axiosInstance.get<ConsultaEnCurso>(`/citas/consultas/${id}/`);
    return data;
  },

  // Inicia una consulta (cambio de estado a EN_CURSO)
  iniciarConsulta: async (id: number): Promise<ConsultaEnCurso> => {
    const { data } = await axiosInstance.patch<ConsultaEnCurso>(`/citas/consultas/${id}/`, {
      estado: 'EN_CURSO' // Asegúrate que el backend espera 'EN_CURSO'
    });
    return data;
  },

  // Completa una consulta y crea la entrada en historial
  completarConsulta: async (id: number, datosConsulta: Partial<ConsultaEnCurso>): Promise<ConsultaEnCurso> => { // Podrías definir un tipo específico para datosConsulta
    const { data } = await axiosInstance.patch<ConsultaEnCurso>( // La respuesta podría ser más específica que ConsultaEnCurso
      `/citas/consultas/${id}/completar/`, 
      {
        ...datosConsulta,
        // El estado 'COMPLETADA' ya se maneja en el backend en la acción 'completar'
        // No es necesario enviarlo aquí si la acción 'completar' lo establece.
      }
    );
    return data;
  },

  // Registra medicamentos recetados durante la consulta
  registrarMedicamentos: async (consultaId: number, medicamentos: any[]): Promise<any> => { // Define un tipo de respuesta más específico
    const { data } = await axiosInstance.post(`/citas/consultas/${consultaId}/medicamentos/`, {
      medicamentos // El backend espera un objeto con una clave "medicamentos" cuyo valor es el array
    });
    return data;
  },

  // --- NUEVA FUNCIÓN PARA OBTENER LA RECETA COMPLETA ---
  /**
   * Obtiene la receta completa (incluyendo medicamentos) asociada a un ID de consulta (cita).
   * @param consultaId El ID de la consulta (citas.models.Consulta)
   * @returns Una promesa con los datos de la receta completa.
   */
  getRecetaPorConsultaId: async (consultaId: number): Promise<RecetaCompletaResponse> => {
    const { data } = await axiosInstance.get<RecetaCompletaResponse>(`/citas/consultas/${consultaId}/receta-completa/`);
    return data;
  },
};

export default consultaApi;