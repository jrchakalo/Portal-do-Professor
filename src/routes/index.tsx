import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import ClassesPage from '../pages/ClassesPage';
import DashboardPage from '../pages/DashboardPage';
import EvaluationsPage from '../pages/EvaluationsPage';
import LoginPage from '../pages/LoginPage';
import StudentsPage from '../pages/StudentsPage';
import { PrivateRoute } from './PrivateRoute';

export const AppRoutes = (): ReactElement => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<PrivateRoute />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/alunos" element={<StudentsPage />} />
        <Route path="/turmas" element={<ClassesPage />} />
        <Route path="/turmas/:id/avaliacoes" element={<EvaluationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
