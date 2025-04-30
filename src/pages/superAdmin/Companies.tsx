import React, { useState, useEffect } from 'react';
import { Building2, Plus, CreditCard, Users, Search, Trash2, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

interface Company {
  id: string;
  name: string;
  admin_email: string;
  admin_name: string;
  admin_phone: string;
  credits: number;
  seat_price: number;
  seat_booking_limit: number;
  status: 'active' | 'inactive';
  created_at: string;
}

const Companies: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      toast.error('Failed to load companies');
      console.error('Error loading companies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (company: Company) => {
    setCompanyToDelete(company);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // Delete all related records in proper order to avoid foreign key constraint violations
      
      // 1. Delete attendance records for the company
      const { error: attendanceError } = await supabase
        .from('attendance')
        .delete()
        .eq('company_id', companyToDelete.id);
      
      if (attendanceError) throw attendanceError;
      
      // 2. Delete credit_transactions for the company
      const { error: transactionsError } = await supabase
        .from('credit_transactions')
        .delete()
        .eq('company_id', companyToDelete.id);
      
      if (transactionsError) throw transactionsError;
      
      // 3. Delete credit_history for the company
      const { error: creditHistoryError } = await supabase
        .from('credit_history')
        .delete()
        .eq('company_id', companyToDelete.id);
      
      if (creditHistoryError) throw creditHistoryError;
      
      // 4. Get employee IDs to delete user accounts
      const { data: employeesData, error: employeesQueryError } = await supabase
        .from('employees')
        .select('id')
        .eq('company_id', companyToDelete.id);
      
      if (employeesQueryError) throw employeesQueryError;
      
      // 5. Delete employees for the company
      const { error: employeesError } = await supabase
        .from('employees')
        .delete()
        .eq('company_id', companyToDelete.id);
      
      if (employeesError) throw employeesError;
      
      // 6. Delete associated user accounts if needed
      if (employeesData && employeesData.length > 0) {
        const employeeIds = employeesData.map(emp => emp.id);
        
        // Delete users where id is in the list of employee IDs
        const { error: usersError } = await supabase
          .from('users')
          .delete()
          .in('id', employeeIds);
        
        if (usersError) throw usersError;
      }
      
      // 7. Finally, delete the company itself
      const { error: companyError } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyToDelete.id);
      
      if (companyError) throw companyError;
      
      // Remove from local state
      setCompanies(companies.filter(c => c.id !== companyToDelete.id));
      toast.success(`${companyToDelete.name} has been deleted successfully`);
      setIsDeleteModalOpen(false);
      setCompanyToDelete(null);
      
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Failed to delete company. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.admin_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.admin_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
        <div className="flex space-x-4">
          <div className="w-64">
            <Input
              placeholder="Search companies..."
              icon={<Search size={18} className="text-gray-400" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Link to="/super-admin/companies/new">
            <Button variant="primary" className="flex items-center">
              <Plus size={20} className="mr-2" />
              Add New Company
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <DataTable
          columns={[
            {
              header: 'Company Name',
              accessor: (company) => (
                <div className="flex items-center">
                  <Building2 size={20} className="text-gray-400 mr-2" />
                  <div>
                    <span className="font-medium text-gray-900">{company.name}</span>
                    <p className="text-sm text-gray-500">{company.admin_email}</p>
                  </div>
                </div>
              ),
            },
            {
              header: 'Administrator',
              accessor: (company) => (
                <div>
                  <p className="font-medium text-gray-900">{company.admin_name}</p>
                  <p className="text-sm text-gray-500">{company.admin_phone}</p>
                </div>
              ),
            },
            {
              header: 'Credits',
              accessor: (company) => (
                <div className="flex items-center">
                  <CreditCard size={20} className="text-gray-400 mr-2" />
                  <Badge variant={company.credits > 100 ? 'success' : 'warning'}>
                    {company.credits} credits
                  </Badge>
                </div>
              ),
            },
            {
              header: 'Seat Price',
              accessor: (company) => `${company.seat_price} credits/seat`,
            },
            {
              header: 'Daily Limit',
              accessor: (company) => `${company.seat_booking_limit} seats`,
            },
            {
              header: 'Status',
              accessor: (company) => (
                <Badge variant={company.status === 'active' ? 'success' : 'danger'}>
                  {company.status}
                </Badge>
              ),
            },
            {
              header: 'Actions',
              accessor: (company) => (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/super-admin/companies/${company.id}/employees`)}
                    className="flex items-center"
                  >
                    <Users size={16} className="mr-1" />
                    View Details
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteClick(company)}
                    className="flex items-center"
                  >
                    <Trash2 size={16} className="mr-1" />
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          data={filteredCompanies}
          keyExtractor={(company) => company.id}
          isLoading={isLoading}
          emptyMessage="No companies found"
        />
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        title="Delete Company"
      >
        <div className="p-6">
          <div className="flex items-center justify-center mb-4 text-red-500">
            <AlertTriangle size={48} />
          </div>
          <h3 className="text-lg font-medium text-center mb-2">Are you sure you want to delete this company?</h3>
          <p className="text-gray-600 text-center mb-6">
            {companyToDelete?.name}
          </p>
          <p className="text-gray-600 text-center mb-6">
            This will permanently delete the company and all associated data including employees, attendance records, and credit history. This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              isLoading={isDeleting}
              loadingText="Deleting..."
            >
              Delete Company
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Companies;