// src/types/mascota.ts
export interface Mascota {
  id?: number;
  nombre: string;
  cliente: number;
  cliente_nombre?: string;  // Campo adicional para mostrar nombre completo
  especie: number;
  especie_nombre?: string;  // Campo adicional para mostrar nombre de especie
  raza: number;
  raza_nombre?: string;     // Campo adicional para mostrar nombre de raza
  fecha_nacimiento: string;
  sexo: string;
  esterilizado: boolean;
  microchip: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  // Campo calculado para conveniencia
  edad?: number;
}

export interface Especie {
  id: number;
  nombre: string;
  descripcion?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Raza {
  id: number;
  nombre: string;
  especie: number;
  descripcion?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FotoMascota {
  id?: number;
  mascota: number;
  url_foto: string;
  es_principal: boolean;
  fecha_subida: string;
  created_at?: string;
  updated_at?: string;
}

export interface RegistroPeso {
  id?: number;
  mascota: number;
  peso: number;
  fecha_registro: string;
  notas?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MascotaResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Mascota[];
}

export interface EspecieResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Especie[];
}

export interface RazaResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Raza[];
}

export interface FotoMascotaResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FotoMascota[];
}

export interface RegistroPesoResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RegistroPeso[];
}

// Para respuesta de historial médico completo
export interface HistorialMedicoCompleto {
  mascota: Mascota;
  consultas: any[];
  tratamientos: any[];
  vacunaciones: any[];
  registros_peso: RegistroPeso[];
}