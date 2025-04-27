import React, { useEffect, useState } from 'react';
import { Users, CreditCard, Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardStore } from '../../stores/dashboardStore';
import { companyService } from '../../services/companyService';
import { attendanceService } from '../../services/attendanceService';
import Card from '../../components/ui/Card';
import StatsCard from '../../components/ui/StatsCard';
import Button from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { Company } from '../../types';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { stats, isLoading, error, fetchAdminStats } = useDashboardStore();
  const [company, setCompany] = useState<Company | null>(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          setCompanyLoading(true);
          const companyData = await companyService.getCompanyByAdminId(user.id);
          setCompany(companyData);
          
          // Fetch dashboard stats for this company
          await fetchAdminStats(companyData.id);
          
          // Load attendance data for last 7 days
          setAttendanceLoading(true);
          const today = format(new Date(), 'yyyy-MM-dd');
          const sevenDaysAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd');
          
          const report = await attendanceService.getCompanyAttendanceReport(
            companyData.id,
            sevenDaysAgo,
            today
          );
          
          setAttendanceData(report);
        } catch (err) {
          console.error('Error loading company data:', err);
        } finally {
          setCompanyLoading(false);
          setAttendanceLoading(false);
        }
      }
    };
    
    loadData();
  }, [user, fetchAdminStats]);
  
  if ((isLoading && !stats) || companyLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
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
        <Button onClick={() => company && fetchAdminStats(company.id)} className="mt-4">Retry</Button>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Dashboard</h1>
          {company && (
            <p className="text-gray-500">{company.name}</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Company Employees"
          value={stats?.attendance.total || 0}
          icon={<Users size={24} />}
          description="Total registered employees"
        />
        
        <StatsCard
          title="Available Credits"
          value={stats?.credits.remaining || 0}
          icon={<CreditCard size={24} />}
          description={`${stats?.credits.used || 0} credits used so far`}
          valueClassName="text-green-600"
        />
        
        <StatsCard
          title="Today's Bookings"
          value={`${stats?.bookings.booked || 0}/${stats?.bookings.limit || 0}`}
          icon={<Calendar size={24} />}
          description={`${stats?.bookings.percentage?.toFixed(1) || 0}% of daily limit`}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card title="Today's Attendance">
          <div className="flex items-center justify-around p-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">
                {stats?.attendance.present || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">Present</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-500">
                {stats?.attendance.absent || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">Absent</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">
                {stats?.attendance.total || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">Total</div>
            </div>
          </div>
          <div className="px-4 pb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-600 h-2.5 rounded-full" 
                style={{ width: `${stats?.attendance.total ? (stats.attendance.present / stats.attendance.total) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>{stats?.attendance.total ? ((stats.attendance.present / stats.attendance.total) * 100).toFixed(1) : 0}%</span>
              <span>100%</span>
            </div>
          </div>
        </Card>
        
        <Card title="Credit Usage">
          <div className="flex items-center justify-around p-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">
                {stats?.credits.total || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">Total</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-amber-500">
                {stats?.credits.used || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">Used</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">
                {stats?.credits.remaining || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">Available</div>
            </div>
          </div>
          <div className="px-4 pb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-amber-500 h-2.5 rounded-full" 
                style={{ width: `${stats?.credits.total ? (stats.credits.used / stats.credits.total) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>{stats?.credits.total ? ((stats.credits.used / stats.credits.total) * 100).toFixed(1) : 0}%</span>
              <span>100%</span>
            </div>
          </div>
        </Card>
      </div>
      
      <Card 
        title={
          <div className="flex justify-between items-center">
            <span>Weekly Attendance (Last 7 Days)</span>
            <Link to="/admin/attendance">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
        }
      >
        {attendanceLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DataTable
              columns={[
                { header: 'Date', accessor: (item) => format(new Date(item.date), 'MMM dd, yyyy') },
                { 
                  header: 'Present', 
                  accessor: (item) => item.attendanceCount.present,
                  className: 'text-center'
                },
                { 
                  header: 'Absent', 
                  accessor: (item) => item.attendanceCount.absent,
                  className: 'text-center'
                },
                { 
                  header: 'Attendance Rate', 
                  accessor: (item) => {
                    const rate = item.attendanceCount.total > 0 
                      ? (item.attendanceCount.present / item.attendanceCount.total) * 100 
                      : 0;
                    
                    let variant: 'success' | 'warning' | 'danger' = 'success';
                    if (rate < 70) variant = 'danger';
                    else if (rate < 90) variant = 'warning';
                    
                    return (
                      <Badge variant={variant}>{rate.toFixed(1)}%</Badge>
                    );
                  },
                  className: 'text-center'
                }
              ]}
              data={attendanceData}
              keyExtractor={(item) => item.date}
              emptyMessage="No attendance data available for the last 7 days"
              onRowClick={(item) => console.log(item)}
            />
          </div>
        )}
      </Card>
      
      <div className="mt-8 grid grid-cols-1 gap-6">
        <Card title="Quick Actions">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/admin/employees" className="w-full">
              <Button variant="outline" fullWidth className="flex items-center justify-center">
                <Users size={18} className="mr-2" />
                View Employees
              </Button>
            </Link>
            <Link to="/admin/attendance" className="w-full">
              <Button variant="outline" fullWidth className="flex items-center justify-center">
                <Calendar size={18} className="mr-2" />
                Attendance History
              </Button>
            </Link>
            <Link to="/admin/credits" className="w-full">
              <Button variant="outline" fullWidth className="flex items-center justify-center">
                <CreditCard size={18} className="mr-2" />
                Credit History
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;