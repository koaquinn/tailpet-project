import axios from 'axios';

// Configuración base para todas las peticiones
const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos de timeout
});

// Interceptor para añadir el token a todas las peticiones
axiosInstance.interceptors.request.use(
  (config) => {
    // Obtener el token del localStorage
    const token = localStorage.getItem('access_token');
    
    // Si existe el token, añadirlo a los headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Si es un error 401 (Unauthorized) y no estamos intentando refrescar el token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Intentar refrescar el token
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          // No hay refresh token, redirigir al login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Llamar al endpoint de refresh token (sin usar el interceptor para evitar ciclos)
        const response = await axios.post(
          `${axiosInstance.defaults.baseURL}/auth/token/refresh/`,
          { refresh: refreshToken }
        );
        
        if (response.data.access) {
          // Guardar el nuevo token
          localStorage.setItem('access_token', response.data.access);
          
          // Actualizar el header y reintentar la petición original
          axiosInstance.defaults.headers.common['Authorization'] = 
            `Bearer ${response.data.access}`;
          originalRequest.headers.Authorization = 
            `Bearer ${response.data.access}`;
            
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Error al refrescar el token, limpiar storage y redirigir a login
        console.error('Error al refrescar el token. Redirigiendo al login...');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Manejo de otros errores
    if (error.response) {
      // Error con respuesta del servidor
      switch (error.response.status) {
        case 400:
          console.error('Datos incorrectos en la solicitud');
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
      // La petición fue realizada pero no se recibió respuesta
      console.error('No se recibió respuesta del servidor. Verifique su conexión');
    } else {
      // Error en la configuración de la petición
      console.error('Error al configurar la petición:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;