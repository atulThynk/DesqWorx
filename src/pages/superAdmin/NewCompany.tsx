import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Building2, Mail, Phone, User, CreditCard, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

interface CompanyFormData {
  name: string;
  adminEmail: string;
  adminName: string;
  adminPhone: string;
  seatPrice: number;
  seatBookingLimit: number;
  initialCredits: number;
}

const NewCompany: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormData>({
    defaultValues: {
      initialCredits: 0,
      seatPrice: 1,
      seatBookingLimit: 1
    }
  });

  const onSubmit = async (data: CompanyFormData) => {
    try {
      setIsLoading(true);

      // Create company with admin details
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: data.name,
          admin_email: data.adminEmail,
          admin_name: data.adminName,
          admin_phone: data.adminPhone,
          credits: data.initialCredits,
          seat_price: data.seatPrice,
          seat_booking_limit: data.seatBookingLimit,
          status: 'active'
        })
        .select()
        .single();

      if (companyError) throw companyError;

      toast.success('Company created successfully');
      navigate('/super-admin/companies');
    } catch (error: any) {
      console.error('Error creating company:', error);
      
      if (error.code === '23505') {
        toast.error('A company with this admin email already exists.');
      } else {
        toast.error(`Failed to create company: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Company</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add a new company and its administrator to the system.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Company Details</h2>
              <div className="space-y-4">
                <Input
                  label="Company Name"
                  icon={<Building2 size={18} className="text-gray-400" />}
                  error={errors.name?.message}
                  {...register('name', {
                    required: 'Company name is required',
                  })}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Initial Credits"
                    type="number"
                    icon={<CreditCard size={18} className="text-gray-400" />}
                    error={errors.initialCredits?.message}
                    {...register('initialCredits', {
                      required: 'Initial credits value is required',
                      min: {
                        value: 0,
                        message: 'Credits must be a positive number'
                      }
                    })}
                  />
                  
                  <Input
                    label="Seat Price (in credits)"
                    type="number"
                    icon={<CreditCard size={18} className="text-gray-400" />}
                    error={errors.seatPrice?.message}
                    {...register('seatPrice', {
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
                    icon={<Calendar size={18} className="text-gray-400" />}
                    error={errors.seatBookingLimit?.message}
                    {...register('seatBookingLimit', {
                      required: 'Booking limit is required',
                      min: {
                        value: 1,
                        message: 'Booking limit must be at least 1'
                      }
                    })}
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Administrator Details</h2>
              <div className="space-y-4">
                <Input
                  label="Admin Name"
                  icon={<User size={18} className="text-gray-400" />}
                  error={errors.adminName?.message}
                  {...register('adminName', {
                    required: 'Admin name is required',
                  })}
                />

                <Input
                  label="Admin Email"
                  type="email"
                  icon={<Mail size={18} className="text-gray-400" />}
                  error={errors.adminEmail?.message}
                  {...register('adminEmail', {
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
                  error={errors.adminPhone?.message}
                  {...register('adminPhone', {
                    required: 'Admin phone is required',
                    pattern: {
                      value: /^\+?[\d\s-]+$/,
                      message: 'Invalid phone number',
                    },
                  })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/super-admin/companies')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
            >
              Create Company
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default NewCompany;