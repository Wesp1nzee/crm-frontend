import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { Layout } from '../layout/Layout';
import { LoginPage } from '../pages/auth/LoginPage';
import { ProtectedRoute } from '../shared/components/ProtectedRoute';
import { RoleGuard } from '../shared/components/RoleGuard';

// Публичная страница
import { PublicHomePage } from '../client/pages/PublicHomePage';

const HomePage = lazy(() => import('../pages/HomePage').then(m => ({ default: m.HomePage })));
const CaseListPage = lazy(() => import('../pages/cases/CaseListPage').then(m => ({ default: m.CaseListPage })));
const CaseDetailPage = lazy(() => import('../pages/cases/CaseDetailPage').then(m => ({ default: m.CaseDetailPage })));
const ClientListPage = lazy(() => import('../pages/clients/ClientListPage').then(m => ({ default: m.ClientListPage })));
const ExpertsPage = lazy(() => import('../pages/experts/ExpertsPage').then(m => ({ default: m.ExpertsPage })));
const DocumentsPage = lazy(() => import('../pages/documents/DocumentsPage').then(m => ({ default: m.DocumentsPage })));
const FinancePage = lazy(() => import('../pages/finance/FinancePage').then(m => ({ default: m.FinancePage })));
// const ReportsPage = lazy(() => import('../pages/reports/ReportsPage').then(m => ({ default: m.ReportsPage })));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const CalendarPage = lazy(() => import('../pages/calendar/CalendarPage').then(m => ({ default: m.CalendarPage })));
const CalculatePage = lazy(() => import('../pages/calculate').then(m => ({ default: m.CalculatePage })));
const LeiferTablePage = lazy(() => import('../pages/calculate').then(m => ({ default: m.LeiferTablePage })));
const MailPage = lazy(() => import('../pages/mail/MailPage').then(m => ({ default: m.MailPage })));

const PageLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
    <CircularProgress />
  </Box>
);

export const router = createBrowserRouter([
  // Публичная главная страница
  {
    path: '/',
    element: <PublicHomePage />,
  },

  // Логин — остаётся на /login
  {
    path: '/login',
    element: <LoginPage />,
  },

  // ВСЕ CRM-маршруты теперь под /crm
  {
    path: '/crm',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><HomePage /></Suspense> },
      { path: 'profile', element: <Suspense fallback={<PageLoader />}><ProfilePage /></Suspense> },
      { path: 'settings', element: <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense> },
      { path: 'cases', element: <Suspense fallback={<PageLoader />}><CaseListPage /></Suspense> },
      { path: 'cases/:id', element: <Suspense fallback={<PageLoader />}><CaseDetailPage /></Suspense> },
      { path: 'clients', element: <Suspense fallback={<PageLoader />}><ClientListPage /></Suspense> },
      { path: 'experts', element: <Suspense fallback={<PageLoader />}><RoleGuard allowedRoles={['admin', 'ceo', 'accountant']}><ExpertsPage /></RoleGuard></Suspense> },
      { path: 'documents', element: <Suspense fallback={<PageLoader />}><DocumentsPage /></Suspense> },
      { path: 'finance', element: <Suspense fallback={<PageLoader />}><RoleGuard allowedRoles={['admin', 'ceo', 'accountant']}><FinancePage /></RoleGuard></Suspense> },
      // { path: 'reports', element: <Suspense fallback={<PageLoader />}><RoleGuard allowedRoles={['admin', 'ceo', 'accountant']}><ReportsPage /></RoleGuard></Suspense> },
      { path: 'calendar', element: <Suspense fallback={<PageLoader />}><CalendarPage /></Suspense> },
      { path: 'calculate', element: <Suspense fallback={<PageLoader />}><CalculatePage /></Suspense> },
      { path: 'calculate/leifer', element: <Suspense fallback={<PageLoader />}><LeiferTablePage /></Suspense> },
      { path: 'mail', element: <Suspense fallback={<PageLoader />}><RoleGuard allowedRoles={['admin', 'ceo', 'accountant']}><MailPage /></RoleGuard></Suspense> },
    ],
  },
]);