/*
  # Fix infinite recursion in users table policies

  1. Changes
     - Drop problematic policies on users table that cause infinite recursion
     - Create revised policies that avoid self-referential queries
     - Use auth.jwt() to check roles instead of querying the users table recursively
  
  2. Security
     - Maintain the same security model but implemented without recursion
     - All RLS policies and their intended access patterns are preserved
*/

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Super admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Super admins can update users" ON public.users;
DROP POLICY IF EXISTS "Super admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Company admins can read their company users" ON public.users;
DROP POLICY IF EXISTS "Company admins can update their company users" ON public.users;
DROP POLICY IF EXISTS "Company admins can insert users in their company" ON public.users;

-- Create revised policies using auth.jwt() instead of recursive queries
-- For super admins
CREATE POLICY "Super admins can read all users" 
ON public.users
FOR SELECT
TO public
USING (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "Super admins can update users" 
ON public.users
FOR UPDATE
TO public
USING (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "Super admins can insert users" 
ON public.users
FOR INSERT
TO public
WITH CHECK (auth.jwt() ->> 'role' = 'super_admin');

-- For company admins (use a non-recursive approach)
-- First we'll create a helper function to avoid recursion
CREATE OR REPLACE FUNCTION public.get_user_company_id(user_id uuid)
RETURNS uuid AS $$
DECLARE
  company_id uuid;
BEGIN
  SELECT u.company_id INTO company_id FROM public.users u WHERE u.id = user_id;
  RETURN company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT u.role INTO user_role FROM public.users u WHERE u.id = user_id;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create the policies using the helper functions
CREATE POLICY "Company admins can read their company users" 
ON public.users
FOR SELECT
TO public
USING (
  public.get_user_role(auth.uid()) = 'admin' AND 
  company_id = public.get_user_company_id(auth.uid())
);

CREATE POLICY "Company admins can update their company users" 
ON public.users
FOR UPDATE
TO public
USING (
  public.get_user_role(auth.uid()) = 'admin' AND 
  company_id = public.get_user_company_id(auth.uid()) AND
  role = 'employee'
);

CREATE POLICY "Company admins can insert users in their company" 
ON public.users
FOR INSERT
TO public
WITH CHECK (
  public.get_user_role(auth.uid()) = 'admin' AND 
  company_id = public.get_user_company_id(auth.uid()) AND
  role = 'employee'
);