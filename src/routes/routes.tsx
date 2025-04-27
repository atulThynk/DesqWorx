import React from 'react';
import { RouteObject } from 'react-router-dom';
import Login from '../pages/auth/Login';
import SuperAdminDashboard from '../pages/superAdmin/Dashboard';
import AdminDashboard from '../pages/admin/Dashboard';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute: React.FC<{
  element: React.ReactNode;
  allowedRoles: string[];
}> = ({ element, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Login />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    // Redirect based on role
    switch (user.role) {
      case 'super_admin':
        return <SuperAdminDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <div>Access Denied</div>;
    }
  }
  
  return <>{element}</>;
};

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Login />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/super-admin',
    element: (
      <ProtectedRoute 
        element={<DashboardLayout />} 
        allowedRoles={['super_admin']} 
      />
    ),
    children: [
      {
        path: 'dashboard',
        element: <SuperAdminDashboard />
      }
    ]
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute 
        element={<DashboardLayout />} 
        allowedRoles={['admin']} 
      />
    ),
    children: [
      {
        path: 'dashboard',
        element: <AdminDashboard />
      }
    ]
  },
  {
    path: '/employee',
    element: (
      <ProtectedRoute 
        element={<DashboardLayout />} 
        allowedRoles={['employee']} 
      />
    ),
    children: []
  }
];

export default routes;