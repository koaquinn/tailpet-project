import axiosInstance from './axiosConfig';
import { 
  Mascota, 
  Especie, 
  Raza, 
  MascotaResponse, 
  EspecieResponse, 
  RazaResponse 
} from '../types/mascota'; // Asumo que tienes estos tipos definidos en alguna parte

// Re-exportamos los tipos para mantener compatibilidad si se usan desde fuera
export type { Mascota, Especie, Raza };

// --- Interfaz para los datos de un Registro de Peso ---
// Asegúrate que esto coincida con lo que devuelve tu RegistroPesoSerializer
export interface RegistroPesoData {
  id: number;
  mascota: number; // O podría ser el objeto Mascota completo si el serializador anida
  peso: string; // DRF DecimalField a menudo viene como string, convertir a number en el frontend
  fecha_registro: string; // Formato "YYYY-MM-DD"
  notas?: string | null;
  // Aquí podrías añadir campos de BaseModel si tu serializador los incluye y los necesitas:
  // created_at?: string;
  // updated_at?: string;
}

// Interfaz para la respuesta paginada de Registros de Peso (si tu API pagina)
export interface RegistroPesoResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RegistroPesoData[];
}


// Mascotas
export const getMascotas = async (params?: { 
  page?: number; 
  page_size?: number;
  cliente?: number;
  activo?: boolean;
}): Promise<MascotaResponse> => {
  try {
    const { data } = await axiosInstance.get<MascotaResponse>('/mascotas/mascotas/', { params });
    return data;
  } catch (error) {
    console.error("Error fetching mascotas:", error);
    throw error; // O maneja el error de forma más específica
  }
};

export const getClientes = async () => { // Deberías tipar la respuesta
  const response = await axiosInstance.get('/clientes/');
  return response.data;
};

export const getMascota = async (id: number): Promise<Mascota> => {
  try {
    const { data } = await axiosInstance.get<Mascota>(`/mascotas/mascotas/${id}/`);
    return data;
  } catch (error) {
    console.error(`Error fetching mascota ${id}:`, error);
    throw error;
  }
};

export const createMascota = async (mascotaData: Omit<Mascota, 'id'>): Promise<Mascota> => { // Omitir 'id' si es autogenerado
  try {
    const { data } = await axiosInstance.post<Mascota>('/mascotas/mascotas/', mascotaData);
    return data;
  } catch (error) {
    console.error("Error creating mascota:", error);
    throw error;
  }
};

export const updateMascota = async (id: number, mascotaData: Partial<Mascota>): Promise<Mascota> => { // Usar Partial para actualizaciones
  try {
    const { data } = await axiosInstance.put<Mascota>(`/mascotas/mascotas/${id}/`, mascotaData);
    return data;
  } catch (error) {
    console.error(`Error updating mascota ${id}:`, error);
    throw error;
  }
};

export const deleteMascota = async (id: number): Promise<void> => { // No suele devolver boolean, sino void o 204 No Content
  try {
    await axiosInstance.delete(`/mascotas/mascotas/${id}/`);
  } catch (error) {
    console.error(`Error deleting mascota ${id}:`, error);
    throw error;
  }
};

// Especies
export const getEspecies = async (): Promise<EspecieResponse> => {
  try {
    const { data } = await axiosInstance.get<EspecieResponse>('/mascotas/especies/');
    return data;
  } catch (error) {
    console.error("Error fetching especies:", error);
    throw error;
  }
};

// ... (otras funciones de Especies y Razas como las tenías) ...
export const getEspecie = async (id: number): Promise<Especie> => {
  try {
    const { data } = await axiosInstance.get<Especie>(`/mascotas/especies/${id}/`);
    return data;
  } catch (error) {
    console.error(`Error fetching especie ${id}:`, error);
    throw error;
  }
};

export const createEspecie = async (especieData: Omit<Especie, 'id'>): Promise<Especie> => {
  try {
    const { data } = await axiosInstance.post<Especie>('/mascotas/especies/', especieData);
    return data;
  } catch (error) {
    console.error("Error creating especie:", error);
    throw error;
  }
};

export const getMascotasByCliente = async (clienteId: number): Promise<MascotaResponse> => {
  try {
    const { data } = await axiosInstance.get<MascotaResponse>('/mascotas/mascotas/', {
      params: { cliente: clienteId }
    });
    return data;
  } catch (error) {
    console.error(`Error fetching mascotas for cliente ${clienteId}:`, error);
    throw error;
  }
};

// Razas
export const getRazas = async (especieId?: number): Promise<RazaResponse> => {
  try {
    const params = especieId ? { especie: especieId } : undefined;
    const { data } = await axiosInstance.get<RazaResponse>('/mascotas/razas/', { params });
    return data;
  } catch (error) {
    console.error("Error fetching razas:", error);
    throw error;
  }
};

export const getRaza = async (id: number): Promise<Raza> => {
  try {
    const { data } = await axiosInstance.get<Raza>(`/mascotas/razas/${id}/`);
    return data;
  } catch (error) {
    console.error(`Error fetching raza ${id}:`, error);
    throw error;
  }
};

export const createRaza = async (razaData: Omit<Raza, 'id'>): Promise<Raza> => {
  try {
    const { data } = await axiosInstance.post<Raza>('/mascotas/razas/', razaData);
    return data;
  } catch (error) {
    console.error("Error creating raza:", error);
    throw error;
  }
};


// Fotos de mascotas
// ... (tus funciones de fotos sin cambios) ...
export const getFotosMascota = async (mascotaId: number): Promise<any> => { /* ... */ };
export const uploadFotoMascota = async (mascotaId: number, fotoFile: File, esPrincipal: boolean = false): Promise<any> => { /* ... */ };


// Historial de mascotas (Esta función parece obtener el historial *completo* desde el endpoint de Mascota)
export const getHistorialMascota = async (mascotaId: number): Promise<any> => { // Tipar la respuesta si es posible
  try {
    const { data } = await axiosInstance.get(`/mascotas/mascotas/${mascotaId}/historial_completo/`);
    return data;
  } catch (error) {
    console.error(`Error fetching historial for mascota ${mascotaId}:`, error);
    throw error;
  }
};


// --- REGISTRO DE PESOS ---
// MODIFICADA para mejor tipado y ordenamiento
export const getRegistrosPesoPorMascota = async (mascotaId: number): Promise<RegistroPesoData[]> => {
  try {
    // Añadimos 'ordering=fecha_registro' para obtenerlos ordenados por fecha ascendente (más antiguo primero)
    // Si necesitas todos los registros sin paginación para el gráfico, y tu API lo soporta,
    // podrías añadir un page_size muy grande o un parámetro para deshabilitar paginación.
    // Por ahora, asumimos que la respuesta paginada es manejada o que obtienes todos.
    const response = await axiosInstance.get<RegistroPesoResponse | RegistroPesoData[]>(
        `/mascotas/registros-peso/`, 
        {
            params: { 
                mascota: mascotaId,
                ordering: 'fecha_registro' // Ordena por fecha_registro ascendente
            }
        }
    );
    // Verifica si la respuesta es paginada (tiene 'results') o es un array directo
    if ('results' in response.data) {
        return response.data.results;
    }
    return response.data as RegistroPesoData[]; // Casting si es un array directo
  } catch (error) {
    console.error(`Error fetching pesos for mascota ${mascotaId}:`, error);
    // Podrías devolver un array vacío en caso de error para que el gráfico no falle
    // throw error; 
    return []; 
  }
};

// La función registrarPesoMascota parece estar bien, solo ajustamos el tipo de retorno si es posible
export const registrarPesoMascota = async (
    mascotaId: number, 
    peso: number, 
    fecha_registro: string, // Asegúrate que el formato sea "YYYY-MM-DD"
    notas?: string
): Promise<RegistroPesoData> => { // Asumimos que devuelve el objeto creado
  try {
    const { data } = await axiosInstance.post<RegistroPesoData>('/mascotas/registros-peso/', { // El endpoint es plural "registros-peso"
      mascota: mascotaId,
      peso,
      fecha_registro,
      notas
    });
    return data;
  } catch (error) {
    console.error(`Error registering peso for mascota ${mascotaId}:`, error);
    throw error;
  }
};


// Exportar como un objeto es una práctica común para agrupar APIs
const mascotaApi = {
    getMascotas,
    getClientes,
    getMascota,
    createMascota,
    updateMascota,
    deleteMascota,
    getEspecies,
    getEspecie,
    createEspecie,
    getMascotasByCliente,
    getRazas,
    getRaza,
    createRaza,
    getFotosMascota,
    uploadFotoMascota,
    getHistorialMascota,
    getRegistrosPesoPorMascota, // Nombre actualizado y función mejorada
    registrarPesoMascota
};

export default mascotaApi;