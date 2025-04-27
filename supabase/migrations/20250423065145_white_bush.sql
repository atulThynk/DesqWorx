/*
  # Fix RLS policies for company creation

  1. Changes
    - Update RLS policies for users table to allow super admin operations
    - Add policies for companies table to allow super admin operations
    - Fix policy conditions to properly handle initial company setup
  
  2. Security
    - Maintain security while allowing proper company creation flow
    - Ensure only super admins can create and manage companies
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Super admins can manage all companies" ON companies;
DROP POLICY IF EXISTS "Super admin full access" ON users;

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
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- Add policy to allow initial user creation during company setup
CREATE POLICY "Allow company admin creation"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
  OR (
    role = 'admin'
    AND EXISTS (
      SELECT 1 FROM companies
      WHERE companies.admin_id = id
    )
  )
);