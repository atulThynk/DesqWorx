/*
  # Initial database schema for DesqWorx Coworking Space Management System

  1. New Tables
    - `users` - Stores all users with role-based access
    - `companies` - Stores company information with credits and seat settings
    - `attendance` - Tracks daily attendance for employees
    - `credit_history` - Records credit transactions
    - `seat_bookings` - Records seat bookings

  2. Security
    - Enable RLS on all tables
    - Add policies for authentication and authorization

  3. Indexes
    - Added appropriate indexes for performance
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  id_proof_url TEXT,
  company_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'employee'))
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  admin_id UUID NOT NULL,
  credits INTEGER DEFAULT 0,
  seat_price INTEGER DEFAULT 0,
  seat_booking_limit INTEGER DEFAULT 0
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  UNIQUE (user_id, date)
);

-- Create credit history table
CREATE TABLE IF NOT EXISTS credit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('assigned', 'used')),
  description TEXT
);

-- Create seat bookings table (fixed without the problematic WHERE clause)
CREATE TABLE IF NOT EXISTS seat_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'cancelled'))
);

-- Create a partial unique index instead of the problematic constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_seat_bookings_unique_confirmed 
  ON seat_bookings (user_id, date) 
  WHERE status = 'confirmed';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_company_id_date ON attendance(company_id, date);
CREATE INDEX IF NOT EXISTS idx_credit_history_company_id ON credit_history(company_id);
CREATE INDEX IF NOT EXISTS idx_seat_bookings_date ON seat_bookings(date);
CREATE INDEX IF NOT EXISTS idx_seat_bookings_company_id_date ON seat_bookings(company_id, date);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users table policies
CREATE POLICY "Super admins can read all users" 
  ON users FOR SELECT 
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin'));

CREATE POLICY "Company admins can read their company users" 
  ON users FOR SELECT 
  USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin') AND 
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can read their own data" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Super admins can insert users" 
  ON users FOR INSERT 
  WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin'));

CREATE POLICY "Company admins can insert users in their company" 
  ON users FOR INSERT 
  WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin') AND 
    company_id = (SELECT company_id FROM users WHERE id = auth.uid()) AND
    role = 'employee'
  );

CREATE POLICY "Super admins can update users" 
  ON users FOR UPDATE 
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin'));

CREATE POLICY "Company admins can update their company users" 
  ON users FOR UPDATE 
  USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin') AND 
    company_id = (SELECT company_id FROM users WHERE id = auth.uid()) AND
    role = 'employee'
  );

-- Fixed policy: Removed the problematic OLD reference
CREATE POLICY "Users can update their own profiles" 
  ON users FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (
    -- Users cannot change their role or company
    role = (SELECT role FROM users WHERE id = auth.uid()) AND 
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Companies table policies
CREATE POLICY "Super admins can manage all companies" 
  ON companies FOR ALL 
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin'));

CREATE POLICY "Admins can read their own company" 
  ON companies FOR SELECT 
  USING (admin_id = auth.uid());

-- Attendance table policies
CREATE POLICY "Super admins can manage all attendance" 
  ON attendance FOR ALL 
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin'));

CREATE POLICY "Company admins can read their company attendance" 
  ON attendance FOR SELECT 
  USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin') AND 
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Company admins can insert attendance for their company" 
  ON attendance FOR INSERT 
  WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin') AND 
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can read their own attendance" 
  ON attendance FOR SELECT 
  USING (user_id = auth.uid());

-- Credit history table policies
CREATE POLICY "Super admins can manage all credit history" 
  ON credit_history FOR ALL 
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin'));

CREATE POLICY "Company admins can read their company's credit history" 
  ON credit_history FOR SELECT 
  USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin') AND 
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Seat bookings table policies
CREATE POLICY "Super admins can manage all seat bookings" 
  ON seat_bookings FOR ALL 
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin'));

CREATE POLICY "Company admins can manage their company's seat bookings" 
  ON seat_bookings FOR ALL 
  USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin') AND 
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can read their own bookings" 
  ON seat_bookings FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own bookings" 
  ON seat_bookings FOR INSERT 
  WITH CHECK (
    user_id = auth.uid() AND 
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  );