// src/api/inventarioApi.ts
import axiosInstance from './axiosConfig';

export interface Proveedor {
  id?: number;
  nombre: string;
  telefono: string;
  email: string;
  activo: boolean;
  tipo: 'MEDICAMENTOS' | 'ALIMENTOS' | 'EQUIPOS' | 'SERVICIOS';
}

export interface Medicamento {
  id?: number;
  nombre: string;
  descripcion?: string;
  tipo: 'ORAL' | 'INYECTABLE' | 'TOPICO' | 'OTRO';
  presentacion: string;
  proveedor: number;
  proveedor_nombre?: string;
  precio_compra: number;
  precio_venta: number;
  stock_minimo: number;
  activo: boolean;
  requiere_receta: boolean;
  es_vacuna?: boolean;
}

export interface LoteMedicamento {
  id?: number;
  medicamento: number;
  medicamento_nombre?: string;
  numero_lote: string;
  fecha_vencimiento: string;
  cantidad: number;
  fecha_ingreso: string;
  proveedor: number;
  proveedor_nombre?: string;
  precio_compra: number;
}

export interface MovimientoInventario {
  id?: number;
  medicamento: number;
  medicamento_nombre?: string;
  lote?: number;
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  cantidad: number;
  fecha: string;
  usuario: number;
  usuario_nombre?: string;
  documento_referencia?: string;
  motivo: string;
  afecta_stock: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Interfaces específicas para vacunas
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
  observaciones?: string;
}

const inventarioApi = {
  // Proveedores
  getProveedores: async (params?: any): Promise<PaginatedResponse<Proveedor>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<Proveedor>>('/inventario/proveedores/', { params });
    return data;
  },

  getProveedor: async (id: number): Promise<Proveedor> => {
    const { data } = await axiosInstance.get<Proveedor>(`/inventario/proveedores/${id}/`);
    return data;
  },

  createProveedor: async (proveedor: Proveedor): Promise<Proveedor> => {
    const { data } = await axiosInstance.post<Proveedor>('/inventario/proveedores/', proveedor);
    return data;
  },

  updateProveedor: async (id: number, proveedor: Partial<Proveedor>): Promise<Proveedor> => {
    const { data } = await axiosInstance.patch<Proveedor>(`/inventario/proveedores/${id}/`, proveedor);
    return data;
  },

  deleteProveedor: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/inventario/proveedores/${id}/`);
  },

  // Medicamentos
  getMedicamentos: async (params?: any): Promise<PaginatedResponse<Medicamento>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<Medicamento>>('/inventario/medicamentos/', { params });
    return data;
  },

  getMedicamento: async (id: number): Promise<Medicamento> => {
    const { data } = await axiosInstance.get<Medicamento>(`/inventario/medicamentos/${id}/`);
    return data;
  },

  createMedicamento: async (medicamento: Medicamento): Promise<Medicamento> => {
    const { data } = await axiosInstance.post<Medicamento>('/inventario/medicamentos/', medicamento);
    return data;
  },

  updateMedicamento: async (id: number, medicamento: Partial<Medicamento>): Promise<Medicamento> => {
    const { data } = await axiosInstance.patch<Medicamento>(`/inventario/medicamentos/${id}/`, medicamento);
    return data;
  },

  deleteMedicamento: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/inventario/medicamentos/${id}/`);
  },

  getMedicamentoStock: async (id: number): Promise<any> => {
    const { data } = await axiosInstance.get<any>(`/inventario/medicamentos/${id}/stock_disponible/`);
    return data;
  },

  // Lotes
  getLotes: async (params?: any): Promise<PaginatedResponse<LoteMedicamento>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<LoteMedicamento>>('/inventario/lotes/', { params });
    return data;
  },

  getLote: async (id: number): Promise<LoteMedicamento> => {
    const { data } = await axiosInstance.get<LoteMedicamento>(`/inventario/lotes/${id}/`);
    return data;
  },

  createLote: async (lote: LoteMedicamento): Promise<LoteMedicamento> => {
    const { data } = await axiosInstance.post<LoteMedicamento>('/inventario/lotes/', lote);
    return data;
  },

  updateLote: async (id: number, lote: Partial<LoteMedicamento>): Promise<LoteMedicamento> => {
    const { data } = await axiosInstance.patch<LoteMedicamento>(`/inventario/lotes/${id}/`, lote);
    return data;
  },

  deleteLote: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/inventario/lotes/${id}/`);
  },

  // Movimientos
  getMovimientos: async (params?: any): Promise<PaginatedResponse<MovimientoInventario>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<MovimientoInventario>>('/inventario/movimientos/', { params });
    return data;
  },

  getMovimiento: async (id: number): Promise<MovimientoInventario> => {
    const { data } = await axiosInstance.get<MovimientoInventario>(`/inventario/movimientos/${id}/`);
    return data;
  },

  createMovimiento: async (movimiento: MovimientoInventario): Promise<MovimientoInventario> => {
    const { data } = await axiosInstance.post<MovimientoInventario>('/inventario/movimientos/', movimiento);
    return data;
  },

  // Entrada de inventario
  registrarEntrada: async (id: number, entradaData: any): Promise<any> => {
    const { data } = await axiosInstance.post<any>(`/inventario/medicamentos/${id}/registrar-entrada/`, entradaData);
    return data;
  },

  // Métodos específicos para vacunas
  
  // Obtener lotes disponibles para vacunas
  getLotesMedicamentoVacunas: async (): Promise<PaginatedResponse<LoteMedicamento>> => {
    try {
      // Obtener lotes con stock disponible
      const params = { cantidad__gt: 0 };
      const { data } = await axiosInstance.get<PaginatedResponse<LoteMedicamento>>('/inventario/lotes/', { params });
      console.log("Lotes disponibles obtenidos:", data);
      return data;
    } catch (error) {
      console.error("Error al obtener lotes de medicamentos:", error);
      throw error;
    }
  },
  
  // Registrar movimiento de inventario para la aplicación de una vacuna
  registrarMovimientoVacuna: async (loteId: number, cantidad: number, mascotaId: number, usuarioId: number, observaciones?: string): Promise<MovimientoInventario> => {
    try {
      // Primero obtenemos información del lote para saber qué medicamento asociar
      const { data: lote } = await axiosInstance.get<LoteMedicamento>(`/inventario/lotes/${loteId}/`);
      
      // Construimos el objeto de movimiento de inventario
      const movimiento: Partial<MovimientoInventario> = {
        medicamento: lote.medicamento,
        lote: loteId,
        tipo: 'SALIDA',
        cantidad: cantidad || 1, // Por defecto 1 dosis
        fecha: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
        usuario: usuarioId,
        motivo: `Vacunación aplicada a mascota ID: ${mascotaId}`,
        afecta_stock: true
      };
      
      if (observaciones) {
        movimiento.motivo += ` - ${observaciones}`;
      }
      
      // Crear el movimiento de inventario
      const { data } = await axiosInstance.post<MovimientoInventario>('/inventario/movimientos/', movimiento);
      return data;
    } catch (error) {
      console.error("Error registrando movimiento de vacuna:", error);
      throw error;
    }
  }
};

export default inventarioApi;