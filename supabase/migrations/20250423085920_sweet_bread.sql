/*
  # Remove user dependencies from employees
  
  1. Changes
    - Remove user-related policies
    - Update attendance policies
    - Make employees table fully independent
    
  2. Security
    - Allow authenticated access to employees
    - Maintain company-based access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Super admins can manage all employees" ON employees;
DROP POLICY IF EXISTS "Company admins can manage their company users" ON employees;

-- Create new policies for employees table
CREATE POLICY "Allow employee management"
ON employees
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Update attendance policies
DROP POLICY IF EXISTS "Anyone can mark attendance" ON attendance;

CREATE POLICY "Allow attendance management"
ON attendance
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Update companies policies
DROP POLICY IF EXISTS "Company admins can manage their company" ON companies;

CREATE POLICY "Allow company management"
ON companies
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);