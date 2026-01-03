import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../layout/Layout';
import { HomePage } from '../pages/HomePage';
import { CaseListPage } from '../pages/cases/CaseListPage';
import { CaseDetailPage } from '../pages/cases/CaseDetailPage';
import { ClientListPage } from '../pages/clients/ClientListPage';
import { ExpertsPage } from '../pages/experts/ExpertsPage';
import { DocumentsPage } from '../pages/documents/DocumentsPage';
import { FinancePage } from '../pages/finance/FinancePage';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { SettingsPage } from '../pages/settings/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'cases', element: <CaseListPage /> },
      { path: 'cases/:id', element: <CaseDetailPage /> },
      { path: 'clients', element: <ClientListPage /> },
      { path: 'experts', element: <ExpertsPage /> },
      { path: 'documents', element: <DocumentsPage /> },
      { path: 'finance', element: <FinancePage /> },
      { path: 'reports', element: <ReportsPage /> },
    ],
  },
]);