// src/api/axiosConfig.ts
import axios from 'axios';

// Configuración base para todas las peticiones
axios.defaults.baseURL = 'http://localhost:8000/api';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Interceptor para manejo de errores global
axios.interceptors.response.use(
  response => response,
  error => {
    // Manejo centralizado de errores
    const { response } = error;
    
    if (response) {
      // Error con respuesta del servidor
      if (response.status === 401) {
        // Unauthorized - problema de autenticación
        console.error('Error de autenticación. Por favor, inicie sesión nuevamente.');
        // Aquí podrías implementar un redireccionamiento al login
      } else if (response.status === 403) {
        // Forbidden - problema de permisos
        console.error('No tiene permisos para realizar esta acción.');
      } else if (response.status === 404) {
        // Not found
        console.error('El recurso solicitado no existe.');
      } else if (response.status === 500) {
        // Error del servidor
        console.error('Error del servidor. Por favor, intente más tarde.');
      }
    } else {
      // Error sin respuesta (probablemente problema de red)
      console.error('Error de conexión. Verifique su conexión a internet.');
    }
    
    return Promise.reject(error);
  }
);

export default axios;