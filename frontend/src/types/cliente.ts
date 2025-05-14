// src/types/cliente.ts
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

export interface DireccionCliente {
  id?: number;
  cliente: number;
  calle: string;
  numero: string;
  departamento?: string;
  ciudad: string;
  region: string;
  codigo_postal?: string;
  es_principal: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ClienteResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Cliente[];
}

export interface DireccionClienteResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DireccionCliente[];
}

// DTO para crear un cliente con direcciones
export interface CreateClienteWithDireccionDto {
  cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>;
  direccion?: Omit<DireccionCliente, 'id' | 'cliente' | 'created_at' | 'updated_at'>;
}

// DTO para respuestas con cliente enriquecido (incluyendo direcciones)
export interface ClienteConDireccionesResponse extends Cliente {
  direcciones: DireccionCliente[];
}