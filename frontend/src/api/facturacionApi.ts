// src/api/facturacionApi.ts (nuevo)
import axiosInstance from './axiosConfig';

export interface MetodoPago {
  id?: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface Servicio {
  id?: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  duracion_estimada?: number;
  activo: boolean;
}

export interface Factura {
  id?: number;
  cliente: number;
  cliente_nombre?: string;
  fecha_emision: string;
  fecha_pago?: string;
  estado: 'PENDIENTE' | 'PAGADA' | 'ANULADA';
  metodo_pago?: number;
  metodo_pago_nombre?: string;
  subtotal: number;
  impuesto: number;
  total: number;
  notas?: string;
}

export interface DetalleFactura {
  id?: number;
  factura: number;
  tipo_item: 'CONSULTA' | 'TRATAMIENTO' | 'MEDICAMENTO' | 'SERVICIO';
  item_id: number;
  cantidad: number;
  precio_unitario: number;
  descuento_porcentaje?: number;
  motivo_descuento?: string;
  subtotal: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const facturacionApi = {
  // Métodos de pago
  getMetodosPago: async (params?: any): Promise<PaginatedResponse<MetodoPago>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<MetodoPago>>('/facturacion/metodos-pago/', { params });
    return data;
  },

  // Servicios
  getServicios: async (params?: any): Promise<PaginatedResponse<Servicio>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<Servicio>>('/facturacion/servicios/', { params });
    return data;
  },

  getServicio: async (id: number): Promise<Servicio> => {
    const { data } = await axiosInstance.get<Servicio>(`/facturacion/servicios/${id}/`);
    return data;
  },

  // Facturas
  getFacturas: async (params?: any): Promise<PaginatedResponse<Factura>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<Factura>>('/facturacion/facturas/', { params });
    return data;
  },

  getFactura: async (id: number): Promise<Factura> => {
    const { data } = await axiosInstance.get<Factura>(`/facturacion/facturas/${id}/`);
    return data;
  },

  createFactura: async (factura: Factura): Promise<Factura> => {
    const { data } = await axiosInstance.post<Factura>('/facturacion/facturas/', factura);
    return data;
  },

  updateFactura: async (id: number, factura: Partial<Factura>): Promise<Factura> => {
    const { data } = await axiosInstance.patch<Factura>(`/facturacion/facturas/${id}/`, factura);
    return data;
  },

  // Detalles de factura
  getDetallesFactura: async (facturaId: number): Promise<PaginatedResponse<DetalleFactura>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<DetalleFactura>>('/facturacion/detalles/', {
      params: { factura: facturaId }
    });
    return data;
  },

  createDetalleFactura: async (detalle: DetalleFactura): Promise<DetalleFactura> => {
    const { data } = await axiosInstance.post<DetalleFactura>('/facturacion/detalles/', detalle);
    return data;
  },

  updateDetalleFactura: async (id: number, detalle: Partial<DetalleFactura>): Promise<DetalleFactura> => {
    const { data } = await axiosInstance.patch<DetalleFactura>(`/facturacion/detalles/${id}/`, detalle);
    return data;
  },

  deleteDetalleFactura: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/facturacion/detalles/${id}/`);
  }
};

export default facturacionApi;