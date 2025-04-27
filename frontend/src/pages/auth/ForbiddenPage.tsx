import React from 'react';
import { Link } from 'react-router-dom';

const ForbiddenPage: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4 py-12 text-center sm:px-6 lg:px-8">
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-12 w-12 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Acceso Denegado</h1>
        <p className="mt-2 text-lg text-gray-600">
          No tienes los permisos necesarios para acceder a esta página.
        </p>
        <div className="mt-6">
          <Link
            to="/dashboard"
            className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-base font-medium text-white hover:bg-indigo-700"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;