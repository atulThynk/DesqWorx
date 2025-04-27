import React, { useEffect } from 'react';
import { Users, CreditCard, Calendar, Building2, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useDashboardStore } from '../../stores/dashboardStore';
import Card from '../../components/ui/Card';
import StatsCard from '../../components/ui/StatsCard';
import Button from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SuperAdminDashboard: React.FC = () => {
  const { stats, isLoading, error, fetchSuperAdminStats } = useDashboardStore();
  
  useEffect(() => {
    fetchSuperAdminStats();
    const intervalId = setInterval(() => {
      fetchSuperAdminStats();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [fetchSuperAdminStats]);

  const attendanceChartData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        label: 'Attendance',
        data: [stats?.attendance.present || 0, stats?.attendance.absent || 0],
        backgroundColor: ['#10B981', '#EF4444'],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };
  
  if (isLoading && !stats) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          Error loading dashboard data: {error}
        </div>
        <Button onClick={fetchSuperAdminStats} className="mt-4">Retry</Button>
      </div>
    );
  }

  const attendancePercentage = stats?.attendance.total 
    ? ((stats.attendance.present / stats.attendance.total) * 100).toFixed(1)
    : 0;

  const creditUsagePercentage = stats?.credits.total
    ? ((stats.credits.used / stats.credits.total) * 100).toFixed(1)
    : 0;
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <Link to="/super-admin/companies/new">
          <Button variant="primary">
            Add New Company
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Companies"
          value={stats?.companies?.total || 0}
          icon={<Building2 size={24} className="text-blue-600" />}
          description="Active companies"
          // trend={{
          //   value: 12,
          //   isPositive: true
          // }}
        />
        
        <StatsCard
          title="Total Employees"
          value={stats?.attendance.total || 0}
          icon={<Users size={24} className="text-green-600" />}
          description="Registered employees"
          // trend={{
          //   value: 8,
          //   isPositive: true
          // }}
        />
        
        <StatsCard
          title="Total Credits"
          value={stats?.credits.total || 0}
          icon={<CreditCard size={24} className="text-purple-600" />}
          description={`${stats?.credits.used || 0} credits used`}
          // trend={{
          //   value: 15,
          //   isPositive: true
          // }}
        />
        
        <StatsCard
          title="Today's Attendance"
          value={`${attendancePercentage}%`}
          icon={<TrendingUp size={24} className="text-amber-600" />}
          description={`${stats?.attendance.present || 0} present today`}
          // trend={{
          //   value: parseFloat(attendancePercentage),
          //   isPositive: parseFloat(attendancePercentage) >= 70
          // }}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card title="Today's Attendance Overview">
          <div className="h-[300px] p-4">
            <Bar data={attendanceChartData} options={chartOptions} />
          </div>
        </Card>
        
        <Card title="Credit Usage Overview">
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-3xl font-bold text-gray-900">{stats?.credits.total || 0}</h3>
                <p className="text-sm text-gray-500">Total Credits</p>
              </div>
              <div className="flex items-center">
                {parseFloat(creditUsagePercentage) < 70 ? (
                  <ArrowUpRight className="w-8 h-8 text-green-500" />
                ) : (
                  <ArrowDownRight className="w-8 h-8 text-red-500" />
                )}
                <span className={`text-lg font-semibold ${
                  parseFloat(creditUsagePercentage) < 70 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {creditUsagePercentage}%
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Used Credits</span>
                  <span className="font-medium">{stats?.credits.used || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${creditUsagePercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Available Credits</span>
                  <span className="font-medium">{stats?.credits.remaining || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${100 - parseFloat(creditUsagePercentage)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card title="Quick Actions">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/super-admin/companies" className="w-full">
              <Button variant="outline" fullWidth className="flex items-center justify-center">
                <Building2 size={18} className="mr-2" />
                Manage Companies
              </Button>
            </Link>
            <Link to="/super-admin/attendance" className="w-full">
              <Button variant="outline" fullWidth className="flex items-center justify-center">
                <Calendar size={18} className="mr-2" />
                View Attendance
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;