import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Lock, LayoutGrid } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
  
    try {
      const { error } = await login(data.email, data.password);
      if (error) throw error;
      
      // Don't navigate here - the AuthContext will handle navigation
    } catch (err) {
      setError('Invalid email or password');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <LayoutGrid size={48} className="text-blue-900" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          DesqWorx
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Coworking Space Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="px-0 py-0">
          <div className="px-6 py-8">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              Sign in to your account
            </h3>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <Input
                label="Email address"
                type="email"
                id="email"
                icon={<Mail size={18} className="text-gray-400" />}
                error={errors.email?.message}
                disabled={isLoading}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />

              <Input
                label="Password"
                type="password"
                id="password"
                icon={<Lock size={18} className="text-gray-400" />}
                error={errors.password?.message}
                disabled={isLoading}
                {...register('password', {
                  required: 'Password is required',
                })}
              />

              <div className="mt-6">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  Sign in
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;