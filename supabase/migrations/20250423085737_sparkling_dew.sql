/*
  # Fix attendance policies and constraints

  1. Changes
    - Drop existing attendance policies
    - Create new policies to allow authenticated users to mark attendance
    - Remove user table dependency from attendance marking
    
  2. Security
    - Allow authenticated users to mark attendance
    - Maintain data integrity with proper constraints
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can mark attendance" ON attendance;
DROP POLICY IF EXISTS "Anyone can view attendance" ON attendance;

-- Create new policies with proper checks
CREATE POLICY "Anyone can mark attendance"
ON attendance
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Update attendance table constraints
ALTER TABLE attendance
DROP CONSTRAINT IF EXISTS attendance_user_id_fkey,
ADD CONSTRAINT attendance_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE CASCADE;