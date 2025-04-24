// src/api/authApi.ts
import axiosInstance from './axiosConfig';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  rol: string;          // ahora un único rol en vez de un array
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

// DTO para crear un usuario
export interface CreateUserDto {
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  password: string;
  rol_id: number;
}

// DTO para actualizar un usuario
export interface UpdateUserDto {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  rol_id?: number;
}

const authApi = {
  /** Inicia sesión y devuelve los tokens + datos del usuario */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post<AuthResponse>(
      '/auth/token/',
      credentials
    );
    return data;
  },

  /** Refresca el access-token */
  refreshToken: async (refresh: string): Promise<{ access: string }> => {
    const { data } = await axiosInstance.post<{ access: string }>(
      '/auth/token/refresh/',
      { refresh }
    );
    return data;
  },

  /** Devuelve el usuario autenticado */
  getMe: async (): Promise<User> => {
    const { data } = await axiosInstance.get<User>('/auth/users/me/');
    return data;
  },

  // ---------------- Administración de usuarios ----------------

  /** Lista usuarios paginados */
  getUsers: async (
    params?: { page?: number; page_size?: number }
  ): Promise<PaginatedResponse<User>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<User>>(
      '/auth/users/',
      { params }
    );
    return data;
  },

  /** Obtiene un usuario por ID */
  getUser: async (userId: number): Promise<User> => {
    const { data } = await axiosInstance.get<User>(
      `/auth/users/${userId}/`
    );
    return data;
  },

  /** Crea un usuario nuevo */
  createUser: async (userData: CreateUserDto): Promise<User> => {
    const { data } = await axiosInstance.post<User>(
      '/auth/users/',
      userData
    );
    return data;
  },

  /** Actualiza un usuario existente */
  updateUser: async (
    userId: number,
    userData: UpdateUserDto
  ): Promise<User> => {
    const { data } = await axiosInstance.patch<User>(
      `/auth/users/${userId}/`,
      userData
    );
    return data;
  },

  /** Elimina un usuario */
  deleteUser: async (userId: number): Promise<void> => {
    await axiosInstance.delete(`/auth/users/${userId}/`);
  },
};

export default authApi;
