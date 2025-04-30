import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/auth/Login';
import SuperAdminDashboard from '../pages/superAdmin/Dashboard';
import Companies from '../pages/superAdmin/Companies';
import NewCompany from '../pages/superAdmin/NewCompany';
import CompanyEmployees from '../pages/superAdmin/CompanyEmployees';
import Attendance from '../pages/superAdmin/Attendance';
import Profile from '../pages/superAdmin/Profile';
import AdminDashboard from '../pages/admin/Dashboard';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import Visitors from '../pages/superAdmin/Visitors';
import AdminCompanyEmployees from '../pages/admin/Employees';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const redirectPath = `/${user.role.toLowerCase().replace('_', '-')}/dashboard`;
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          user ? (
            <Navigate 
              to={`/${user.role.toLowerCase().replace('_', '-')}/dashboard`} 
              replace 
            />
          ) : (
            <Login />
          )
        } 
      />
      
      {/* Super Admin Routes */}
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="companies" element={<Companies />} />
        <Route path="companies/new" element={<NewCompany />} />
        <Route path="companies/:id/employees" element={<CompanyEmployees />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="profile" element={<Profile />} />
        <Route path="visitors" element={<Visitors />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminCompanyEmployees />} />
        <Route path="employees" element={<AdminCompanyEmployees/>} />
        {/* <Route path="credits" element={<div>Credits Page</div>} />
        <Route path="attendance" element={<div>Attendance Page</div>} /> */}
      </Route>

      {/* Employee Routes */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<div>Employee Dashboard</div>} />
        <Route path="attendance" element={<div>Attendance Page</div>} />
        <Route path="profile" element={<div>Profile Page</div>} />
      </Route>

      {/* Default Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route 
        path="*" 
        element={
          user ? (
            <Navigate 
              to={`/${user.role.toLowerCase().replace('_', '-')}/dashboard`} 
              replace 
            />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
    </Routes>
  );
}

export default AppRoutes;