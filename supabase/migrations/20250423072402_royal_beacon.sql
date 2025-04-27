/*
  # Separate employees into their own table
  
  1. Changes
    - Create new employees table
    - Update companies table structure
    - Remove employee-specific fields from users table
    - Add appropriate foreign key constraints and indexes
    
  2. Security
    - Enable RLS on new table
    - Add appropriate policies for access control
*/

-- First drop all dependent policies
DROP POLICY IF EXISTS "Admins can read their own company" ON companies;
DROP POLICY IF EXISTS "Allow company_admin to update own company" ON companies;
DROP POLICY IF EXISTS "Allow company_admin to delete own company" ON companies;
DROP POLICY IF EXISTS "Company admins can read their company attendance" ON attendance;
DROP POLICY IF EXISTS "Company admins can insert attendance for their company" ON attendance;
DROP POLICY IF EXISTS "Company admins can read their company's credit history" ON credit_history;
DROP POLICY IF EXISTS "Company admins can manage their company's seat bookings" ON seat_bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON seat_bookings;
DROP POLICY IF EXISTS "Company admin read access" ON users;
DROP POLICY IF EXISTS "Company admin insert employees" ON users;
DROP POLICY IF EXISTS "Company admin update employees" ON users;
DROP POLICY IF EXISTS "User self-update" ON users;
DROP POLICY IF EXISTS "company_admin_access" ON users;
DROP POLICY IF EXISTS "user_self_update" ON users;

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  id_proof_url TEXT
);

-- Create indexes for employees table
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);

-- Enable RLS on employees table
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create policies for employees table
CREATE POLICY "Super admins can manage all employees"
ON employees
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- Update companies table to simplify structure
ALTER TABLE companies
  DROP COLUMN IF EXISTS admin_id CASCADE,
  ADD COLUMN IF NOT EXISTS admin_email TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS admin_name TEXT,
  ADD COLUMN IF NOT EXISTS admin_phone TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Create new policies for companies
CREATE POLICY "Company admins can manage their company"
ON companies
FOR ALL
TO authenticated
USING (admin_email = (
  SELECT email FROM users WHERE id = auth.uid()
));

-- Update users table to focus on authentication
ALTER TABLE users DROP COLUMN IF EXISTS company_id CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS phone;
ALTER TABLE users DROP COLUMN IF EXISTS id_proof_url;

-- Update existing foreign key constraints
ALTER TABLE attendance
  DROP CONSTRAINT IF EXISTS attendance_user_id_fkey,
  ADD CONSTRAINT attendance_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE seat_bookings
  DROP CONSTRAINT IF EXISTS seat_bookings_user_id_fkey,
  ADD CONSTRAINT seat_bookings_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE CASCADE;

-- Create new policies for attendance
CREATE POLICY "Company admins can manage attendance"
ON attendance
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM companies c
    WHERE c.admin_email = (SELECT email FROM users WHERE id = auth.uid())
    AND c.id = attendance.company_id
  )
);

-- Create new policies for credit history
CREATE POLICY "Company admins can view credit history"
ON credit_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM companies c
    WHERE c.admin_email = (SELECT email FROM users WHERE id = auth.uid())
    AND c.id = credit_history.company_id
  )
);

-- Create new policies for seat bookings
CREATE POLICY "Company admins can manage bookings"
ON seat_bookings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM companies c
    WHERE c.admin_email = (SELECT email FROM users WHERE id = auth.uid())
    AND c.id = seat_bookings.company_id
  )
);

CREATE POLICY "Employees can manage their bookings"
ON seat_bookings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = seat_bookings.user_id
    AND e.email = (SELECT email FROM users WHERE id = auth.uid())
  )
);