/*
  # Update attendance policies to allow public access
  
  1. Changes
    - Drop existing restrictive policies
    - Add new policy to allow anyone to mark attendance
    - Maintain credit deduction logic through triggers
    
  2. Security
    - Allow public access for attendance marking
    - Maintain data integrity through proper constraints
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Company admins can manage attendance" ON attendance;
DROP POLICY IF EXISTS "Super admins can manage all attendance" ON attendance;

-- Create new policies for attendance table
CREATE POLICY "Anyone can mark attendance"
ON attendance
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy for reading attendance
CREATE POLICY "Anyone can view attendance"
ON attendance
FOR SELECT
TO authenticated
USING (true);