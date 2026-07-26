import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import HomePage from '@/pages/HomePage';
import CoursesPage from '@/pages/CoursesPage';
import CalcToolsPage from '@/pages/CalcToolsPage';
import CalculatorDetailPage from '@/pages/CalculatorDetailPage';
import PlannerPage from '@/pages/PlannerPage';
import LogbookPage from '@/pages/LogbookPage';
import LoginPage from '@/pages/LoginPage';
import AdminPage from '@/pages/AdminPage';
import EquipmentPage from '@/pages/EquipmentPage';
import { ProfilePage } from '@/pages/ProfilePage';
import ExpeditionToolPage from '@/pages/ExpeditionToolPage';
import ExpeditionDetailPage from '@/pages/ExpeditionDetailPage';

// FORZAR INCLUSION DEL ADMIN Y EQUIPO (evitar tree-shaking)
const _ensureModulesLoaded = () => {
  console.log('Modules loaded:', AdminPage.name, EquipmentPage.name);
  return { AdminPage, EquipmentPage };
};

export default function App() {
  // Evaluar la funcion para que Vite no la elimine
  _ensureModulesLoaded();
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminPage />} />
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout><HomePage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/cursos" element={
        <ProtectedRoute>
          <AppLayout><CoursesPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/calc-tools" element={
        <ProtectedRoute>
          <AppLayout><CalcToolsPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/calculadoras/:slug" element={
        <ProtectedRoute>
          <AppLayout><CalculatorDetailPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/planificador" element={
        <ProtectedRoute>
          <AppLayout><PlannerPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/bitacora" element={
        <ProtectedRoute>
          <AppLayout><LogbookPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/equipo" element={
        <ProtectedRoute>
          <AppLayout><EquipmentPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/herramientas/expediciones" element={
        <ProtectedRoute>
          <AppLayout><ExpeditionToolPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/expedition/:id" element={
        <ProtectedRoute>
          <AppLayout><ExpeditionDetailPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/perfil" element={
        <ProtectedRoute>
          <AppLayout><ProfilePage /></AppLayout>
        </ProtectedRoute>
      } />
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}