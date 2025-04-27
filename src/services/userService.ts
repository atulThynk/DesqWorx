import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

export const userService = {
  createInitialSuperAdmin: async (): Promise<void> => {
    try {
      console.log('Checking for existing super admin...');
      
      // Check if super admin exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'admin@desqworx.com')
        .eq('role', 'super_admin');
        
      if (checkError) throw checkError;
      
      if (!existingUsers || existingUsers.length === 0) {
        console.log('No super admin found, creating one...');
        
        // Create auth user first
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: 'admin@desqworx.com',
          password: 'Admin123!',
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
            data: {
              role: 'super_admin'
            }
          }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('No user returned from auth creation');

        // Create company
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .insert([{
            name: 'DesqWorx Management',
            admin_id: authData.user.id,
            credits: 0,
            seat_price: 0,
            seat_booking_limit: 0
          }])
          .select()
          .single();

        if (companyError) throw companyError;

        // Create user record
        const { error: userError } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            full_name: 'Super Admin',
            email: 'admin@desqworx.com',
            phone: '1234567890',
            company_id: company.id,
            role: 'super_admin'
          }]);

        if (userError) throw userError;

        console.log('Super admin created successfully');
      } else {
        console.log('Super admin already exists');
      }
    } catch (error) {
      console.error('Error in createInitialSuperAdmin:', error);
      throw error;
    }
  },

  // Rest of the service methods remain unchanged...
};