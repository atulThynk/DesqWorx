import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { User, Phone, Mail, History, CreditCard, Users, CheckCircle, XCircle, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { attendanceService } from '../../services/attendanceService';
import { creditService } from '../../services/creditService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import HistoryModal from '../../components/ui/HistoryModal';
import { format } from 'date-fns';

interface Employee {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  company_id: string;
  id_proof_url?: string;
}

interface Company {
  id: string;
  name: string;
  credits: number;
}

interface AttendanceSummary {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
}

const AdminCompanyEmployees: React.FC = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [creditHistory, setCreditHistory] = useState<any[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [isCreditHistoryOpen, setIsCreditHistoryOpen] = useState(false);
  const [isAttendanceHistoryOpen, setIsAttendanceHistoryOpen] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0
  });

  useEffect(() => {
    // Load the data when component mounts
    loadData();
  }, []);

  useEffect(() => {
    // Filter employees based on search term
    if (searchTerm.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(employee => 
        employee.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  }, [searchTerm, employees]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // First, get current user to get company ID
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!sessionData.session) {
        throw new Error('No active session found');
      }
      
      // Get user details including company_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('company_id, role')
        .eq('id', sessionData.session.user.id)
        .single();
      
      if (userError) throw userError;
      
      if (!userData || !userData.company_id) {
        throw new Error('User has no associated company');
      }
      
      // Ensure user is admin
      if (userData.role !== 'admin') {
        throw new Error('Unauthorized access');
      }
      
      const companyId = userData.company_id;
      
      // Get company info
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name, credits')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData);

      // Get employees for this company
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (employeesError) throw employeesError;
      setEmployees(employeesData || []);
      setFilteredEmployees(employeesData || []);
      
      // Get today's attendance summary
      await loadAttendanceSummary(companyId, employeesData?.length || 0);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load company data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAttendanceSummary = async (companyId: string, totalEmployees: number) => {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Get today's attendance records for this company
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('user_id')
        .eq('company_id', companyId)
        .eq('date', today)
        .eq('status', 'present');
        
      if (attendanceError) throw attendanceError;
      
      const presentToday = attendanceData?.length || 0;
      const absentToday = totalEmployees - presentToday;
      
      setAttendanceSummary({
        totalEmployees,
        presentToday,
        absentToday
      });
      
    } catch (error) {
      console.error('Error loading attendance summary:', error);
      // Don't show toast here to avoid too many errors if this fails
    }
  };

  const loadCreditHistory = async () => {
    if (!company) return;
    try {
      setIsHistoryLoading(true);
      const { data } = await creditService.getCreditHistory(company.id);
      setCreditHistory(data || []);
    } catch (error) {
      console.error('Error loading credit history:', error);
      toast.error('Failed to load credit history');
    } finally {
      setIsHistoryLoading(false);
    }
  };
  
  // Add a function to render ID proof image if available
  const renderIdProof = (url: string | null | undefined) => {
    if (!url) return <span className="text-gray-500">Not uploaded</span>;
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
        View ID
      </a>
    );
  };

  const loadAttendanceHistory = async (employeeId: string) => {
    try {
      setIsHistoryLoading(true);
      const { data } = await attendanceService.getAttendanceHistory(employeeId);
      setAttendanceHistory(data || []);
    } catch (error) {
      console.error('Error loading attendance history:', error);
      toast.error('Failed to load attendance history');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleViewAttendanceHistory = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    loadAttendanceHistory(employeeId);
    setIsAttendanceHistoryOpen(true);
  };

  const handleViewCreditHistory = () => {
    loadCreditHistory();
    setIsCreditHistoryOpen(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-20 bg-gray-200 rounded mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Company Employees</h1>
        {company && (
          <p className="text-sm text-gray-500 mt-1">{company.name}</p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <CreditCard size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Available Credits</p>
              <p className="text-xl font-bold text-gray-900">{company?.credits || 0}</p>
            </div>
          </div>
          <button 
            onClick={handleViewCreditHistory}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            View History
          </button>
        </Card>

        <Card className="bg-white p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-gray-100 mr-4">
              <Users size={24} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-xl font-bold text-gray-900">{attendanceSummary.totalEmployees}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 mr-4">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Present Today</p>
              <p className="text-xl font-bold text-gray-900">{attendanceSummary.presentToday}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 mr-4">
              <XCircle size={24} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Absent Today</p>
              <p className="text-xl font-bold text-gray-900">{attendanceSummary.absentToday}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search employees by name..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <Card>
        <DataTable
          columns={[
            {
              header: 'Employee Name',
              accessor: (employee) => (
                <div className="flex items-center">
                  <User size={20} className="text-gray-400 mr-2" />
                  <span className="font-medium text-gray-900">{employee.full_name}</span>
                </div>
              ),
            },
            {
              header: 'Email',
              accessor: (employee) => (
                <div className="flex items-center">
                  <Mail size={16} className="text-gray-400 mr-2" />
                  <span>{employee.email}</span>
                </div>
              ),
            },
            {
              header: 'Phone',
              accessor: (employee) => (
                <div className="flex items-center">
                  <Phone size={16} className="text-gray-400 mr-2" />
                  <span>{employee.phone}</span>
                </div>
              ),
            },
            // {
            //   header: 'ID Proof',
            //   accessor: (employee) => renderIdProof(employee.id_proof_url),
            // },
            {
              header: 'Status',
              accessor: (employee) => (
                <Badge variant={employee.status === 'active' ? 'success' : 'danger'}>
                  {employee.status}
                </Badge>
              ),
            },
            {
              header: 'Actions',
              accessor: (employee) => (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewAttendanceHistory(employee.id)}
                  className="flex items-center"
                >
                  <History size={16} className="mr-1" />
                  View History
                </Button>
              ),
            }
          ]}
          data={filteredEmployees}
          keyExtractor={(employee) => employee.id}
          emptyMessage="No employees found"
        />
      </Card>

      <HistoryModal
        isOpen={isCreditHistoryOpen}
        onClose={() => setIsCreditHistoryOpen(false)}
        title="Credit History"
        type="credit"
        data={creditHistory}
        isLoading={isHistoryLoading}
      />

      <HistoryModal
        isOpen={isAttendanceHistoryOpen}
        onClose={() => setIsAttendanceHistoryOpen(false)}
        title="Attendance History"
        type="attendance"
        data={attendanceHistory}
        isLoading={isHistoryLoading}
      />
    </div>
  );
};

export default AdminCompanyEmployees;