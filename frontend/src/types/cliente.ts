
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
  
  export interface ClienteResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Cliente[];
  }