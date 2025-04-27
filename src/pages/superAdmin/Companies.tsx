import React, { useState, useEffect } from 'react';
import { Building2, Plus, CreditCard, Users, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';

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
    </div>
  );
};

export default Companies;