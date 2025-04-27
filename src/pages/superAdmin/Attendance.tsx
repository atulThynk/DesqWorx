import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Search, Check, X, History } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import { attendanceService } from '../../services/attendanceService';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import HistoryModal from '../../components/ui/HistoryModal';

interface Employee {
  id: string;
  full_name: string;
  email: string;
  company_id: string;
  company_name: string;
  attendance_status?: 'present' | 'absent';
  attendance_id?: string;
}

const Attendance: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          companies (
            name
          ),
          attendance!left (
            id,
            status
          )
        `)
        .eq('status', 'active')
        .eq('attendance.date', today);

      if (error) throw error;

      const formattedData = data?.map(emp => ({
        id: emp.id,
        full_name: emp.full_name,
        email: emp.email,
        company_id: emp.company_id,
        company_name: emp.companies.name,
        attendance_status: emp.attendance?.[0]?.status,
        attendance_id: emp.attendance?.[0]?.id
      })) || [];

      setEmployees(formattedData);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setIsLoading(false);
    }
  };

  const markAttendance = async (employeeId: string, companyId: string, status: 'present' | 'absent') => {
    try {
      // Check if there is an existing attendance record for this employee on this date
      const { data: existingAttendance, error: fetchError } = await supabase
        .from('attendance')
        .select('status')
        .eq('user_id', employeeId)
        .eq('company_id', companyId)
        .eq('date', today)
        .single();
  
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw fetchError;
      }
  
      // Get company information for credit operations
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('credits, seat_price')
        .eq('id', companyId)
        .single();
  
      if (companyError) throw companyError;
  
      // Case 1: Marking as present (new record or changing from absent)
      if (status === 'present') {
        if (company.credits < company.seat_price) {
          toast.error('Company does not have enough credits');
          return;
        }
  
        // Deduct credits
        const { error: creditError } = await supabase
          .from('companies')
          .update({ credits: company.credits - company.seat_price })
          .eq('id', companyId);
  
        if (creditError) throw creditError;
  
        // Record credit usage
        const { error: historyError } = await supabase
          .from('credit_history')
          .insert({
            company_id: companyId,
            amount: company.seat_price,
            action: 'used',
            description: `Attendance marked for ${today}`
          });
  
        if (historyError) throw historyError;
      }
      // Case 2: Correcting from present to absent - refund credits without modifying credit_history
      else if (existingAttendance && existingAttendance.status === 'present') {
        // Add credits back to company without recording in credit_history
        const { error: creditError } = await supabase
          .from('companies')
          .update({ credits: company.credits + company.seat_price })
          .eq('id', companyId);
  
        if (creditError) throw creditError;
  
        // We don't add or remove any records from credit_history for this case
      }
  
      // Use the attendance service to mark attendance
      await attendanceService.markAttendance(employeeId, companyId, status);
      
      toast.success(`Attendance marked as ${status}`);
      loadEmployees();
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    }
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

  const handleViewHistory = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    loadAttendanceHistory(employeeId);
    setIsHistoryOpen(true);
  };

  const filteredEmployees = employees.filter(emp => 
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
        <div className="w-64">
          <Input
            placeholder="Search employees..."
            icon={<Search size={18} className="text-gray-400" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <DataTable
          columns={[
            {
              header: 'Employee Name',
              accessor: (employee) => (
                <div>
                  <div className="font-medium text-gray-900">{employee.full_name}</div>
                  <div className="text-sm text-gray-500">{employee.email}</div>
                </div>
              ),
            },
            {
              header: 'Company',
              accessor: (employee) => employee.company_name,
            },
            {
              header: 'Status',
              accessor: (employee) => (
                <Badge
                  variant={employee.attendance_status === 'present' ? 'success' : 'danger'}
                >
                  {employee.attendance_status || 'Not marked'}
                </Badge>
              ),
            },
            {
              header: 'Actions',
              accessor: (employee) => (
                <div className="flex items-center space-x-2">
                  {employee.attendance_status ? (
                    <Button
                      size="sm"
                      variant={employee.attendance_status === 'present' ? 'danger' : 'success'}
                      onClick={() => markAttendance(
                        employee.id,
                        employee.company_id,
                        employee.attendance_status === 'present' ? 'absent' : 'present'
                      )}
                      className="flex items-center"
                    >
                      {employee.attendance_status === 'present' ? (
                        <X size={16} className="mr-1" />
                      ) : (
                        <Check size={16} className="mr-1" />
                      )}
                      Mark {employee.attendance_status === 'present' ? 'Absent' : 'Present'}
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => markAttendance(employee.id, employee.company_id, 'present')}
                        className="flex items-center"
                      >
                        <Check size={16} className="mr-1" />
                        Present
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => markAttendance(employee.id, employee.company_id, 'absent')}
                        className="flex items-center"
                      >
                        <X size={16} className="mr-1" />
                        Absent
                      </Button>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewHistory(employee.id)}
                    className="flex items-center"
                  >
                    <History size={16} className="mr-1" />
                    History
                  </Button>
                </div>
              ),
            },
          ]}
          data={filteredEmployees}
          keyExtractor={(employee) => employee.id}
          isLoading={isLoading}
          emptyMessage="No employees found"
        />
      </Card>

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title="Attendance History"
        type="attendance"
        data={attendanceHistory}
        isLoading={isHistoryLoading}
      />
    </div>
  );
};

export default Attendance;