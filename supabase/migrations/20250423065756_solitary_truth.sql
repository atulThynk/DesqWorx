/*
  # Fix RLS policies for company creation

  1. Changes
    - Add policy to allow super admin to create initial admin users
    - Fix company creation policies
    - Ensure proper access control while allowing necessary operations
  
  2. Security
    - Maintain security while allowing company setup flow
    - Ensure proper role-based access control
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Allow company admin creation" ON users;
DROP POLICY IF EXISTS "Super admins can manage users" ON users;
DROP POLICY IF EXISTS "Super admins can manage companies" ON companies;

-- Create new policies for users table
CREATE POLICY "Super admins can manage users"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- Add policy to allow initial admin user creation
CREATE POLICY "Allow initial admin creation"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  (role = 'admin' AND 
   EXISTS (
     SELECT 1 FROM users super_admin
     WHERE super_admin.id = auth.uid()
     AND super_admin.role = 'super_admin'
   ))
);

-- Create new policies for companies table
CREATE POLICY "Super admins can manage companies"
ON companies
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);