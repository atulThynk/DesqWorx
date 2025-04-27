import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { User, Mail, Lock, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

interface ProfileFormData {
  fullName: string;
  email: string;
  phone: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    setValue: setProfileValue,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>();

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
    watch,
  } = useForm<PasswordFormData>();

  const newPassword = watch('newPassword');

  useEffect(() => {
    if (user) {
      setProfileValue('fullName', user.fullName);
      setProfileValue('email', user.email);
      setProfileValue('phone', user.phone || '');
    }
  }, [user, setProfileValue]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      setIsLoading(true);

      // Update auth email if changed
      if (data.email !== user?.email) {
        const { error: updateEmailError } = await supabase.auth.updateUser({
          email: data.email,
        });

        if (updateEmailError) throw updateEmailError;
      }

      // Update user profile
      const { error: updateProfileError } = await supabase
        .from('users')
        .update({
          full_name: data.fullName,
          email: data.email,
          phone: data.phone,
        })
        .eq('id', user?.id);

      if (updateProfileError) throw updateProfileError;

      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      setIsPasswordLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      resetPasswordForm();
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* <Card title="Personal Information">
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              icon={<User size={18} className="text-gray-400" />}
              error={profileErrors.fullName?.message}
              {...registerProfile('fullName', {
                required: 'Full name is required',
              })}
            />

            <Input
              label="Email"
              type="email"
              icon={<Mail size={18} className="text-gray-400" />}
              error={profileErrors.email?.message}
              {...registerProfile('email', {
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
              error={profileErrors.phone?.message}
              {...registerProfile('phone', {
                required: 'Phone is required',
                pattern: {
                  value: /^\+?[\d\s-]+$/,
                  message: 'Invalid phone number',
                },
              })}
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
              >
                Update Profile
              </Button>
            </div>
          </form>
        </Card> */}

        <Card title="Change Password">
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              icon={<Lock size={18} className="text-gray-400" />}
              error={passwordErrors.currentPassword?.message}
              {...registerPassword('currentPassword', {
                required: 'Current password is required',
              })}
            />

            <Input
              label="New Password"
              type="password"
              icon={<Lock size={18} className="text-gray-400" />}
              error={passwordErrors.newPassword?.message}
              {...registerPassword('newPassword', {
                required: 'New password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
              })}
            />

            <Input
              label="Confirm New Password"
              type="password"
              icon={<Lock size={18} className="text-gray-400" />}
              error={passwordErrors.confirmPassword?.message}
              {...registerPassword('confirmPassword', {
                required: 'Please confirm your password',
                validate: value =>
                  value === newPassword || 'Passwords do not match',
              })}
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                isLoading={isPasswordLoading}
              >
                Update Password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Profile;