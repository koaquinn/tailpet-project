// src/api/axiosConfig.ts
import axios, { AxiosRequestConfig } from 'axios';

// Extiende el tipo de configuración para permitir `_retry`
interface AxiosRequestConfigWithRetry extends AxiosRequestConfig {
  _retry?: boolean;
}

// Configuración base para todas las peticiones
const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos de timeout
});

// Interceptor para añadir el token a todas las peticiones
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar respuestas y errores
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfigWithRetry;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post(
          'http://localhost:8000/api/auth/token/refresh/',
          { refresh: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (response.data.access) {
          localStorage.setItem('access_token', response.data.access);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          }

          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        console.error('Error al refrescar el token:', refreshError);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Manejo de otros errores
    if (error.response) {
      switch (error.response.status) {
        case 400:
          console.error('Datos incorrectos en la solicitud:', error.response.data);
          break;
        case 403:
          console.error('No tiene permisos para realizar esta acción');
          break;
        case 404:
          console.error('El recurso solicitado no existe');
          break;
        case 500:
          console.error('Error del servidor. Por favor, intente más tarde');
          break;
        default:
          console.error(`Error inesperado: ${error.response.status}`);
      }
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor. Verifique su conexión');
    } else {
      console.error('Error al configurar la petición:', error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
