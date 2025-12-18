import { createBrowserRouter, Navigate } from 'react-router-dom';
import { CreatePilotPage } from '../pages/CreatePilotPage';
import { CameraDetailsPage } from '../pages/CameraDetailsPage';
import { SetupPage } from '../pages/SetupPage';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { PilotDetailsPage } from '../pages/PilotDetailsPage';
import { CustomerWelcomePage } from '../pages/CustomerWelcomePage';
import { UsersPage } from '../pages/UsersPage';
import { UserDetailsPage } from '../pages/UserDetailsPage';
import { UserFormPage } from '../pages/UserFormPage';
import { CustomersPage } from '../pages/CustomersPage';
import { CustomerDetailsPage } from '../pages/CustomerDetailsPage';
import { CustomerFormPage } from '../pages/CustomerFormPage';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

// Root redirect component that checks auth state
function RootRedirect() {
  const authData = localStorage.getItem('auth_user');
  const isAuthenticated = !!authData;
  
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/onboard/new',
    element: (
      <ProtectedRoute>
        <CreatePilotPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/pilots/create',
    element: (
      <ProtectedRoute>
        <CreatePilotPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/pilots/:id',
    element: (
      <ProtectedRoute>
        <PilotDetailsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/pilots',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/alerts',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/users',
    element: (
      <ProtectedRoute>
        <UsersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/users/new',
    element: (
      <ProtectedRoute>
        <UserFormPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/users/:id',
    element: (
      <ProtectedRoute>
        <UserDetailsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/users/:id/edit',
    element: (
      <ProtectedRoute>
        <UserFormPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/customers',
    element: (
      <ProtectedRoute>
        <CustomersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/customers/new',
    element: (
      <ProtectedRoute>
        <CustomerFormPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/customers/:id',
    element: (
      <ProtectedRoute>
        <CustomerDetailsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/customers/:id/edit',
    element: (
      <ProtectedRoute>
        <CustomerFormPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/assets',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  // Public customer-facing routes
  {
    path: '/welcome/:id',
    element: <CustomerWelcomePage />,
  },
  {
    path: '/camera-details/:id',
    element: <CameraDetailsPage />,
  },
  {
    path: '/setup/:id',
    element: <SetupPage />,
  },
]);
