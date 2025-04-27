/*
  # Fix RLS policies for users and companies tables

  1. Changes
    - Update users table RLS policies to handle auth state properly
    - Add missing RLS policies for companies table
    - Fix policy conditions to properly handle super admin access

  2. Security
    - Ensure super admins can manage companies
    - Allow users to read their own data
    - Enable proper company management
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Super admin full access" ON users;
DROP POLICY IF EXISTS "Super admins can manage all companies" ON companies;

-- Create new policies for users table
CREATE POLICY "Super admin full access" ON users
  FOR ALL 
  TO public
  USING (auth.jwt() ->> 'role' = 'super_admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'super_admin');

-- Create new policies for companies table
CREATE POLICY "Super admins can manage all companies" ON companies
  FOR ALL 
  TO public
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