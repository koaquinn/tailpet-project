// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import ClientesList from "./pages/clientes/ClientesLIst";
import ClienteForm from "./pages/clientes/ClienteForm";
import MascotasList from "./pages/mascotas/MascotasList";
import MascotaForm from "./pages/mascotas/MascotaForm";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="clientes" element={<ClientesList />} />
          <Route path="clientes/nuevo" element={<ClienteForm />} />
          <Route path="clientes/:id" element={<ClienteForm />} />
          <Route path="mascotas" element={<MascotasList />} />
          <Route path="mascotas/nuevo" element={<MascotaForm />} />
          <Route path="mascotas/:id" element={<MascotaForm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
