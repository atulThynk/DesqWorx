/*
  # Clean up and simplify user table policies

  1. Changes
    - Remove redundant and overlapping policies
    - Consolidate policies into clear, focused rules
    - Maintain security while reducing complexity
    
  2. Security
    - Super admins retain full access
    - Company admins can manage their company's users
    - Users can read their own data
    - Proper role-based access control
*/

-- First, drop all existing policies on the users table
DROP POLICY IF EXISTS "Super admins can manage users" ON users;
DROP POLICY IF EXISTS "Allow initial admin creation" ON users;
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Company admins can manage their company users" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable all access for super admins" ON users;
DROP POLICY IF EXISTS "Enable company admin access" ON users;

-- Create new, simplified policies

-- 1. Super admin full access
CREATE POLICY "super_admin_access"
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

-- 2. Company admin access (can manage their company's users except super admins)
CREATE POLICY "company_admin_access"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users admin
    WHERE admin.id = auth.uid()
    AND admin.role = 'admin'
    AND admin.company_id = users.company_id
  )
  AND users.role != 'super_admin'
);

-- 3. User self-access (users can read their own data)
CREATE POLICY "user_self_access"
ON users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 4. User self-update (users can update their own non-sensitive data)
CREATE POLICY "user_self_update"
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND role = (SELECT role FROM users WHERE id = auth.uid())
  AND company_id = (SELECT company_id FROM users WHERE id = auth.uid())
);