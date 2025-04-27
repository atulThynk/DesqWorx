import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { User, Mail, Phone, Plus, Trash2, CreditCard, Building2, History } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { creditService } from '../../services/creditService';
import { attendanceService } from '../../services/attendanceService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import HistoryModal from '../../components/ui/HistoryModal';
import { format } from 'date-fns';

interface AddCreditFormData {
  amount: number;
  description: string;
}

interface Employee {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  company_id: string;
}

interface Company {
  id: string;
  name: string;
  admin_email: string;
  admin_name: string;
  admin_phone: string;
  credits: number;
  seat_price: number;
  seat_booking_limit: number;
}

interface EmployeeFormData {
  fullName: string;
  email: string;
  phone: string;
}

interface CreditFormData {
  credits: number;
}

interface CompanyFormData {
  name: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  seatPrice: number;
  seatBookingLimit: number;
}

const CompanyEmployees: React.FC = () => {
  const { id: companyId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creditHistory, setCreditHistory] = useState<any[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [isCreditHistoryOpen, setIsCreditHistoryOpen] = useState(false);
  const [isAttendanceHistoryOpen, setIsAttendanceHistoryOpen] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isAddCreditModalOpen, setIsAddCreditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);

  const {
    register: registerEmployee,
    handleSubmit: handleEmployeeSubmit,
    reset: resetEmployeeForm,
    formState: { errors: employeeErrors },
  } = useForm<EmployeeFormData>();

  const {
    register: registerCredits,
    handleSubmit: handleCreditSubmit,
    setValue: setCreditValue,
    formState: { errors: creditErrors },
  } = useForm<CreditFormData>();

  const {
    register: registerCompany,
    handleSubmit: handleCompanySubmit,
    setValue: setCompanyValue,
    formState: { errors: companyErrors },
  } = useForm<CompanyFormData>();

  const {
    register: registerAddCredit,
    handleSubmit: handleAddCreditSubmit,
    reset: resetAddCreditForm,
    formState: { errors: addCreditErrors },
  } = useForm<AddCreditFormData>();

  useEffect(() => {
    if (companyId) {
      loadCompanyAndEmployees();
    }
  }, [companyId]);

  const loadCompanyAndEmployees = async () => {
    try {
      setIsLoading(true);
      
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData);

      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (employeesError) throw employeesError;
      setEmployees(employeesData || []);
    } catch (error) {
      console.error('Error loading company data:', error);
      toast.error('Failed to load company data');
      navigate('/super-admin/companies');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCreditHistory = async () => {
    if (!companyId) return;
    try {
      setIsHistoryLoading(true);
      const { data } = await creditService.getCreditHistory(companyId);
      setCreditHistory(data || []);
    } catch (error) {
      console.error('Error loading credit history:', error);
      toast.error('Failed to load credit history');
    } finally {
      setIsHistoryLoading(false);
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

  const handleViewAttendanceHistory = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    loadAttendanceHistory(employeeId);
    setIsAttendanceHistoryOpen(true);
  };

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      setIsSubmitting(true);

      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .insert({
          full_name: data.fullName,
          email: data.email,
          phone: data.phone,
          company_id: companyId,
          status: 'active'
        })
        .select()
        .single();

      if (employeeError) throw employeeError;

      toast.success('Employee added successfully');
      setIsModalOpen(false);
      resetEmployeeForm();
      loadCompanyAndEmployees();
    } catch (error: any) {
      console.error('Error adding employee:', error);
      if (error.code === '23505') {
        toast.error('An employee with this email already exists');
      } else {
        toast.error('Failed to add employee');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (employeeId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('employees')
        .update({ status: newStatus })
        .eq('id', employeeId);

      if (error) throw error;

      toast.success(`Employee ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      loadCompanyAndEmployees();
    } catch (error) {
      console.error('Error updating employee status:', error);
      toast.error('Failed to update employee status');
    }
  };

  const confirmDelete = (employeeId: string) => {
    setEmployeeToDelete(employeeId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmedDelete = async () => {
    if (!employeeToDelete) return;
    
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeToDelete);

      if (error) throw error;

      toast.success('Employee deleted successfully');
      loadCompanyAndEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    } finally {
      setShowDeleteConfirm(false);
      setEmployeeToDelete(null);
    }
  };

  const handleCreditUpdate = async (data: CreditFormData) => {
    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('companies')
        .update({ credits: data.credits })
        .eq('id', companyId);

      if (error) throw error;

      toast.success('Credits updated successfully');
      setIsCreditModalOpen(false);
      loadCompanyAndEmployees();
    } catch (error) {
      console.error('Error updating credits:', error);
      toast.error('Failed to update credits');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompanyUpdate = async (data: CompanyFormData) => {
    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('companies')
        .update({
          name: data.name,
          admin_name: data.adminName,
          admin_email: data.adminEmail,
          admin_phone: data.adminPhone,
          seat_price: data.seatPrice,
          seat_booking_limit: data.seatBookingLimit
        })
        .eq('id', companyId);

      if (error) throw error;

      toast.success('Company information updated successfully');
      setIsCompanyModalOpen(false);
      loadCompanyAndEmployees();
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('Failed to update company information');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCredits = async (data: AddCreditFormData) => {
    try {
      setIsSubmitting(true);
      await creditService.addCredits(companyId!, data.amount, data.description);
      toast.success('Credits added successfully');
      setIsAddCreditModalOpen(false);
      resetAddCreditForm();
      loadCompanyAndEmployees();
      loadCreditHistory();
    } catch (error) {
      console.error('Error adding credits:', error);
      toast.error('Failed to add credits');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreditModal = () => {
    if (company) {
      setCreditValue('credits', company.credits);
      setIsCreditModalOpen(true);
    }
  };

  const openCompanyModal = () => {
    if (company) {
      setCompanyValue('name', company.name);
      setCompanyValue('adminName', company.admin_name);
      setCompanyValue('adminEmail', company.admin_email);
      setCompanyValue('adminPhone', company.admin_phone);
      setCompanyValue('seatPrice', company.seat_price);
      setCompanyValue('seatBookingLimit', company.seat_booking_limit);
      setIsCompanyModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Employees</h1>
          {company && (
            <div className="mt-1">
              <div className="flex items-center">
                <p className="text-sm text-gray-500">{company.name}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openCompanyModal}
                  className="ml-2"
                >
                  <Building2 size={16} className="mr-1" />
                  Edit Company
                </Button>
              </div>
              <div className="flex items-center mt-2">
                <span className="text-sm font-medium text-gray-600 mr-2">Available Credits:</span>
                <Badge variant="primary" className="cursor-pointer" onClick={openCreditModal}>
                  {company.credits} credits
                </Badge>
              </div>
            </div>
          )}
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => {
              setIsAddCreditModalOpen(true);
              loadCreditHistory();
            }}
            className="flex items-center"
          >
            <CreditCard size={20} className="mr-2" />
            Add Credits
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Add Employee
          </Button>
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
              accessor: 'email',
            },
            {
              header: 'Phone',
              accessor: 'phone',
            },
            {
              header: 'Status',
              accessor: (employee) => (
                <Badge 
                  variant={employee.status === 'active' ? 'success' : 'danger'}
                  className="cursor-pointer"
                  onClick={() => handleStatusChange(employee.id, employee.status)}
                >
                  {employee.status}
                </Badge>
              ),
            },
            {
              header: 'Actions',
              accessor: (employee) => (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewAttendanceHistory(employee.id)}
                    className="flex items-center"
                  >
                    <History size={16} className="mr-1" />
                    History
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => confirmDelete(employee.id)}
                    className="flex items-center"
                  >
                    <Trash2 size={16} className="mr-1" />
                    Delete
                  </Button>
                </div>
              ),
            }
          ]}
          data={employees}
          keyExtractor={(employee) => employee.id}
          emptyMessage="No employees found"
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Employee"
      >
        <form onSubmit={handleEmployeeSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            icon={<User size={18} className="text-gray-400" />}
            error={employeeErrors.fullName?.message}
            {...registerEmployee('fullName', {
              required: 'Full name is required',
            })}
          />

          <Input
            label="Email"
            type="email"
            icon={<Mail size={18} className="text-gray-400" />}
            error={employeeErrors.email?.message}
            {...registerEmployee('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
          />

          <Input
            label="Phone"
            icon={<Phone size={18} className="text-gray-400" />}
            error={employeeErrors.phone?.message}
            {...registerEmployee('phone', {
              required: 'Phone is required',
              pattern: {
                value: /^\+?[\d\s-]+$/,
                message: 'Invalid phone number',
              },
            })}
          />

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Add Employee
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isCreditModalOpen}
        onClose={() => setIsCreditModalOpen(false)}
        title="Manage Company Credits"
      >
        <form onSubmit={handleCreditSubmit(handleCreditUpdate)} className="space-y-4">
          <Input
            label="Credits"
            type="number"
            icon={<CreditCard size={18} className="text-gray-400" />}
            error={creditErrors.credits?.message}
            {...registerCredits('credits', {
              required: 'Credits value is required',
              min: {
                value: 0,
                message: 'Credits must be a positive number'
              }
            })}
          />

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Update Credits
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        title="Edit Company Information"
      >
        <form onSubmit={handleCompanySubmit(handleCompanyUpdate)} className="space-y-4">
          <Input
            label="Company Name"
            icon={<Building2 size={18} className="text-gray-400" />}
            error={companyErrors.name?.message}
            {...registerCompany('name', {
              required: 'Company name is required',
            })}
          />

          <Input
            label="Admin Name"
            icon={<User size={18} className="text-gray-400" />}
            error={companyErrors.adminName?.message}
            {...registerCompany('adminName', {
              required: 'Admin name is required',
            })}
          />

          <Input
            label="Admin Email"
            type="email"
            icon={<Mail size={18} className="text-gray-400" />}
            error={companyErrors.adminEmail?.message}
            {...registerCompany('adminEmail', {
              required: 'Admin email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
          />

          <Input
            label="Admin Phone"
            icon={<Phone size={18} className="text-gray-400" />}
            error={companyErrors.adminPhone?.message}
            {...registerCompany('adminPhone', {
              required: 'Admin phone is required',
              pattern: {
                value: /^\+?[\d\s-]+$/,
                message: 'Invalid phone number',
              },
            })}
          />

          <Input
            label="Seat Price (credits)"
            type="number"
            icon={<CreditCard size={18} className="text-gray-400" />}
            error={companyErrors.seatPrice?.message}
            {...registerCompany('seatPrice', {
              required: 'Seat price is required',
              min: {
                value: 1,
                message: 'Seat price must be at least 1'
              }
            })}
          />

          <Input
            label="Daily Booking Limit"
            type="number"
            icon={<User size={18} className="text-gray-400" />}
            error={companyErrors.seatBookingLimit?.message}
            {...registerCompany('seatBookingLimit', {
              required: 'Booking limit is required',
              min: {
                value: 1,
                message: 'Booking limit must be at least 1'
              }
            })}
          />

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCompanyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Update Company
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isAddCreditModalOpen}
        onClose={() => setIsAddCreditModalOpen(false)}
        title="Add Credits"
        size="lg"
      >
        <form onSubmit={handleAddCreditSubmit(handleAddCredits)} className="space-y-4">
          <Input
            label="Amount"
            type="number"
            icon={<CreditCard size={18} className="text-gray-400" />}
            error={addCreditErrors.amount?.message}
            {...registerAddCredit('amount', {
              required: 'Amount is required',
              min: {
                value: 1,
                message: 'Amount must be at least 1'
              }
            })}
          />

          <Input
            label="Description"
            icon={<Mail size={18} className="text-gray-400" />}
            error={addCreditErrors.description?.message}
            {...registerAddCredit('description', {
              required: 'Description is required'
            })}
          />

          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Credit History</h3>
            <DataTable
              columns={[
                {
                  header: 'Date',
                  accessor: (item) => format(new Date(item.created_at), 'MMM dd, yyyy HH:mm'),
                },
                {
                  header: 'Amount',
                  accessor: (item) => (
                    <span className={item.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {item.amount >= 0 ? '+' : ''}{item.amount}
                    </span>
                  ),
                },
                {
                  header: 'Previous Balance',
                  accessor: 'previous_balance',
                },
                {
                  header: 'New Balance',
                  accessor: 'new_balance',
                },
                {
                  header: 'Description',
                  accessor: 'description',
                },
              ]}
              data={creditHistory}
              keyExtractor={(item) => item.id}
              isLoading={isHistoryLoading}
              emptyMessage="No credit history available"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddCreditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Add Credits
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Confirm Delete"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this employee? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmedDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

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

export default CompanyEmployees;