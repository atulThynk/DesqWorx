/*
  # Fix RLS policies for initial setup

  1. Changes
    - Add policy to allow super admin creation without RLS check
    - Add policy for super admin to manage all users
    - Add policy for users to read their own data
    - Add policy for company admins to manage their company's users
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Allow initial super admin creation" ON public.users;
DROP POLICY IF EXISTS "Super admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Users can read their own data" ON public.users;
DROP POLICY IF EXISTS "Company admins can manage their company users" ON public.users;

-- Create new policies with proper checks
CREATE POLICY "Allow initial super admin creation"
ON public.users
FOR INSERT
TO public
WITH CHECK (
  email = 'admin@desqworx.com' 
  AND role = 'super_admin'
);

CREATE POLICY "Super admins can manage all users"
ON public.users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'super_admin'
  )
);

CREATE POLICY "Users can read their own data"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Company admins can manage their company users"
ON public.users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
    AND u.company_id = users.company_id
  )
  AND users.role != 'super_admin'
);