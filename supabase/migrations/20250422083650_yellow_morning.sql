/*
  # Fix recursive user policies

  1. Changes
    - Remove recursive function calls from user policies
    - Replace with direct column comparisons
    - Maintain same security rules but avoid infinite recursion
    
  2. Security
    - Maintains existing access control rules
    - Policies still enforce proper role-based access
*/

-- Drop existing policies that use recursive functions
DROP POLICY IF EXISTS "Company admins can insert users in their company" ON users;
DROP POLICY IF EXISTS "Company admins can read their company users" ON users;
DROP POLICY IF EXISTS "Company admins can update their company users" ON users;
DROP POLICY IF EXISTS "Super admins can insert users" ON users;
DROP POLICY IF EXISTS "Super admins can read all users" ON users;
DROP POLICY IF EXISTS "Super admins can update users" ON users;

-- Recreate policies without recursive function calls
CREATE POLICY "Company admins can insert users in their company"
ON users
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users admin_user
    WHERE admin_user.id = auth.uid()
    AND admin_user.role = 'admin'
    AND admin_user.company_id = company_id
  )
  AND role = 'employee'
);

CREATE POLICY "Company admins can read their company users"
ON users
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM users admin_user
    WHERE admin_user.id = auth.uid()
    AND admin_user.role = 'admin'
    AND admin_user.company_id = company_id
  )
);

CREATE POLICY "Company admins can update their company users"
ON users
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM users admin_user
    WHERE admin_user.id = auth.uid()
    AND admin_user.role = 'admin'
    AND admin_user.company_id = company_id
  )
  AND role = 'employee'
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users admin_user
    WHERE admin_user.id = auth.uid()
    AND admin_user.role = 'admin'
    AND admin_user.company_id = company_id
  )
  AND role = 'employee'
);

CREATE POLICY "Super admins can insert users"
ON users
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users super_admin
    WHERE super_admin.id = auth.uid()
    AND super_admin.role = 'super_admin'
  )
);

CREATE POLICY "Super admins can read all users"
ON users
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM users super_admin
    WHERE super_admin.id = auth.uid()
    AND super_admin.role = 'super_admin'
  )
);

CREATE POLICY "Super admins can update users"
ON users
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM users super_admin
    WHERE super_admin.id = auth.uid()
    AND super_admin.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users super_admin
    WHERE super_admin.id = auth.uid()
    AND super_admin.role = 'super_admin'
  )
);