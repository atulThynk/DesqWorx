import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  Users, 
  CreditCard, 
  Calendar, 
  LogOut, 
  Menu, 
  X, 
  Building2,
  Bell,
  User,
  Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const DashboardLayout: React.FC = () => {
  const { user, logout, getUserRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const role = getUserRole();
  
  const superAdminLinks = [
    { path: '/super-admin/dashboard', icon: <LayoutGrid size={20} />, label: 'Dashboard' },
    { path: '/super-admin/companies', icon: <Building2 size={20} />, label: 'Companies' },
    { path: '/super-admin/attendance', icon: <Calendar size={20} />, label: 'Attendance' },
    { path: '/super-admin/visitors', icon: <Settings size={20} />, label: 'Visitors' },
    { path: '/super-admin/profile', icon: <Settings size={20} />, label: 'Profile' },
  ];
  
  const adminLinks = [
    // { path: '/admin/dashboard', icon: <LayoutGrid size={20} />, label: 'Dashboard' },
    { path: '/admin/employees', icon: <Users size={20} />, label: 'Dashboard' },
    // { path: '/admin/credits', icon: <CreditCard size={20} />, label: 'Credits' },
    // { path: '/admin/attendance', icon: <Calendar size={20} />, label: 'Attendance' },
  ];
  
  const employeeLinks = [
    { path: '/employee/dashboard', icon: <LayoutGrid size={20} />, label: 'Dashboard' },
    { path: '/employee/attendance', icon: <Calendar size={20} />, label: 'Attendance' },
    { path: '/employee/profile', icon: <User size={20} />, label: 'Profile' },
  ];
  
  let navLinks;
  
  switch(role) {
    case 'super_admin':
      navLinks = superAdminLinks;
      break;
    case 'admin':
      navLinks = adminLinks;
      break;
    case 'employee':
      navLinks = employeeLinks;
      break;
    default:
      navLinks = [];
  }
  
  const handleLogout = async () => {
    await logout();
  };
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };
  
  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
      
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        {/* Mobile sidebar header with close button */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <span className="text-lg font-semibold text-gray-800">DesqWorx</span>
          <button
            onClick={toggleSidebar}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Sidebar content */}
        <div className="h-full flex flex-col justify-between overflow-y-auto">
          <div className="flex-1">
            {/* Sidebar header - visible on desktop */}
            <div className="hidden md:flex items-center h-16 px-6 border-b border-gray-200">
              <LayoutGrid size={24} className="text-blue-900 mr-2" />
              <span className="text-lg font-semibold text-gray-800">DesqWorx</span>
            </div>
            
            {/* User info */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User size={20} className="text-blue-900" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                    {user?.fullName}
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-[180px]">
                    {role === 'super_admin' ? 'Super Administrator' : role === 'admin' ? 'Company Administrator' : 'Employee'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Navigation links */}
            <nav className="px-3 pt-4">
              <div className="space-y-1">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <button
                      key={link.path}
                      onClick={() => handleNavigation(link.path)}
                      className={`
                        w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md
                        ${
                          isActive
                            ? 'bg-blue-50 text-blue-900'
                            : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <span className={`mr-3 ${isActive ? 'text-blue-900' : 'text-gray-500'}`}>
                        {link.icon}
                      </span>
                      {link.label}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
          
          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50"
            >
              <LogOut size={20} className="mr-3 text-gray-500" />
              Sign out
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        {/* Top navbar */}
        <div className="bg-white shadow z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                {/* Mobile menu button */}
                <button
                  onClick={toggleSidebar}
                  className="md:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none"
                >
                  <Menu size={24} />
                </button>
              </div>
              
              {/* Notification and profile */}
              <div className="flex items-center">
                <button className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none">
                  <Bell size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;