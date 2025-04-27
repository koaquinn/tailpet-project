// src/pages/UsersPage.tsx
import React, { useState, useEffect, ChangeEvent, FC } from 'react';
import authApi, { User as ApiUser, PaginatedResponse, UpdateUserDto } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';

interface Role {
  id: number;
  nombre: string;
  descripcion: string;
}

// ApiUser ahora define 'rol: string'
interface User extends ApiUser {}

const UsersPage: FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { hasRole } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        authApi.getUsers(),
        authApi.getRoles(),           // usamos getRoles de authApi
      ]);
      setUsers(usersRes.results);
      setRoles(rolesRes.results);
    } catch (err) {
      console.error(err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const changeRole = async (userId: number, roleId: number) => {
    setLoading(true);
    try {
      const payload: UpdateUserDto = { rol_id: roleId };
      await authApi.updateUser(userId, payload);
      await fetchData();
    } catch (err) {
      console.error(err);
      setError('Error al actualizar el rol');
    } finally {
      setLoading(false);
    }
  };

  if (!hasRole('ADMIN')) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold text-red-600">Acceso denegado</h1>
        <p>No tienes permisos para ver esta página.</p>
      </div>
    );
  }

  if (loading) return <div className="p-4">Cargando…</div>;
  if (error)  return <div className="p-4 text-red-600 font-bold">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Administración de Usuarios</h1>
      <div className="overflow-x-auto bg-white shadow rounded-lg mb-8">
        <table className="min-w-full table-auto divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Usuario', 'Nombre', 'Email', 'Rol', 'Acciones'].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">{u.username}</td>
                <td className="px-6 py-4 whitespace-nowrap">{u.first_name} {u.last_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{u.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                    {u.rol}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    defaultValue=""
                    className="rounded-md border border-gray-300 py-1 px-2 text-sm"
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                      const newRole = Number(e.target.value);
                      if (newRole) changeRole(u.id, newRole);
                      e.currentTarget.value = '';
                    }}
                  >
                    <option value="" disabled>Cambiar rol…</option>
                    {roles.map((r) => (
                      <option
                        key={r.id}
                        value={r.id}
                        disabled={r.nombre === u.rol}
                      >
                        {r.nombre}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersPage;