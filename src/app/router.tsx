import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { ThemeEffect } from './theme-effect';
import { HomePage } from '../pages/HomePage';
import { AdminAccessPage } from '../pages/AdminAccessPage';
import { LoginPage } from '../pages/LoginPage';
import { RegistrationPage } from '../pages/RegistrationPage';
import { AppointmentsPage } from '../pages/AppointmentsPage';
import { AppointmentFormPage } from '../pages/AppointmentFormPage';
import { BirthdaysHubPage } from '../pages/BirthdaysHubPage';
import { BirthdaysContactsPage } from '../pages/BirthdaysPage';
import { BirthdayBackgroundsPage } from '../pages/BirthdayBackgroundsPage';
import { BirthdayGroupsPage } from '../pages/BirthdayGroupsPage';
import { BirthdayBatchPage } from '../pages/BirthdayBatchPage';
import { BirthdayTemplatesPage } from '../pages/BirthdayTemplatesPage';
import { SettingsPage } from '../pages/SettingsPage';
import { WorkspaceBlankPage } from '../pages/WorkspaceBlankPage';

export function AppRouter() {
  return (
    <>
      <ThemeEffect />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<WorkspaceBlankPage title="Dashboard" />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/appointments/new" element={<AppointmentFormPage mode="create" />} />
          <Route path="/appointments/:id/edit" element={<AppointmentFormPage mode="edit" />} />
          <Route path="/birthdays" element={<BirthdaysHubPage />} />
          <Route path="/birthdays/contacts" element={<BirthdaysContactsPage />} />
          <Route path="/birthdays/backgrounds" element={<BirthdayBackgroundsPage />} />
          <Route path="/birthdays/groups" element={<BirthdayGroupsPage />} />
          <Route path="/birthdays/batch" element={<BirthdayBatchPage />} />
          <Route path="/birthdays/templates" element={<BirthdayTemplatesPage />} />
          <Route path="/registration" element={<RegistrationPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin/integrations" element={<HomePage />} />
          <Route path="/admin/access" element={<AdminAccessPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
