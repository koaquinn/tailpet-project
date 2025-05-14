// src/utils/formatters.ts

/**
 * Formatea una fecha ISO a formato local (DD/MM/YYYY)
 */
export const formatDate = (isoDate: string): string => {
  if (!isoDate) return '';
  
  const date = new Date(isoDate);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formatea el nombre completo de una persona
 */
export const formatFullName = (nombre: string, apellido: string): string => {
  if (!nombre && !apellido) return 'Sin nombre';
  return `${nombre || ''} ${apellido || ''}`.trim();
};

/**
 * Calcula la edad en años a partir de una fecha de nacimiento
 */
export const calculateAge = (fechaNacimiento: string): number => {
  if (!fechaNacimiento) return 0;
  
  const birthDate = new Date(fechaNacimiento);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Valida un RUT chileno
 */
export const validateRut = (rut: string): boolean => {
  if (!rut) return false;
  
  // Formato básico: 12345678-9 o 1234567-8
  return /^[0-9]{7,8}-[0-9kK]$/.test(rut);
};

/**
 * Valida un email
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida un número de teléfono
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone) return false;
  
  // Acepta formatos como: +56912345678, 912345678, etc.
  return /^[+]?[0-9]{9,12}$/.test(phone);
};

/**
 * Convierte un valor booleano a texto "Sí"/"No"
 */
export const booleanToText = (value: boolean): string => {
  return value ? 'Sí' : 'No';
};

/**
 * Trunca un texto largo y añade puntos suspensivos
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text || text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Formatea un valor monetario
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP'
  }).format(value);
};

/**
 * Convierte código de sexo a texto
 */
export const sexoToText = (sexo: string): string => {
  return sexo === 'M' ? 'Macho' : sexo === 'H' ? 'Hembra' : 'Desconocido';
};