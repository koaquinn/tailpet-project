// src/api/authApi.ts (corregido)
import axiosInstance from './axiosConfig';

export interface LoginCredentials {
  credential: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  rol: string;
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

export interface Role {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface CreateUserDto {
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  password: string;
  rol_id: number;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  rol_id?: number;
}

const authApi = {
  login: async (credentials: LoginCredentials) => {
    const { data } = await axiosInstance.post<AuthResponse>('/auth/token/', {
      credential: credentials.credential,
      password: credentials.password
    });
    return data;
  },

  refreshToken: async (refresh: string): Promise<{ access: string }> => {
    const { data } = await axiosInstance.post<{ access: string }>(
      '/auth/token/refresh/',
      { refresh }
    );
    return data;
  },

  getMe: async (): Promise<User> => {
    const { data } = await axiosInstance.get<User>('/auth/users/me/');
    return data;
  },

  getUsers: async (
    params?: { page?: number; page_size?: number }
  ): Promise<PaginatedResponse<User>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<User>>(
      '/auth/users/',
      { params }
    );
    return data;
  },

  getUser: async (userId: number): Promise<User> => {
    const { data } = await axiosInstance.get<User>(
      `/auth/users/${userId}/`
    );
    return data;
  },

  createUser: async (userData: CreateUserDto): Promise<User> => {
    const { data } = await axiosInstance.post<User>(
      '/auth/users/',
      userData
    );
    return data;
  },

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

  deleteUser: async (userId: number): Promise<void> => {
    await axiosInstance.delete(`/auth/users/${userId}/`);
  },

  // Añadir método para obtener roles
  getRoles: async (): Promise<PaginatedResponse<Role>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<Role>>('/auth/roles/');
    return data;
  }
};

export default authApi;