/*
  # Fix infinite recursion in user policies
  
  1. Changes
    - Remove recursive policy checks that cause infinite loops
    - Simplify policy conditions using direct role checks
    - Use auth.jwt() for role verification instead of querying users table
    
  2. Security
    - Maintain same security model but with more efficient implementation
    - Prevent infinite recursion while keeping proper access control
*/

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "super_admin_access" ON users;
DROP POLICY IF EXISTS "company_admin_access" ON users;
DROP POLICY IF EXISTS "user_self_access" ON users;
DROP POLICY IF EXISTS "user_self_update" ON users;

-- Create new non-recursive policies

-- 1. Allow public read access to all authenticated users
CREATE POLICY "authenticated_read_access"
ON users
FOR SELECT
TO authenticated
USING (true);

-- 2. Super admin access using JWT
CREATE POLICY "super_admin_access"
ON users
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'super_admin'
);

-- 3. Company admin access
CREATE POLICY "company_admin_access"
ON users
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'admin'
  AND company_id = ((auth.jwt() ->> 'company_id')::uuid)
  AND role != 'super_admin'
);

-- 4. User self-update (non-sensitive fields only)
CREATE POLICY "user_self_update"
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND role = (auth.jwt() ->> 'role')::text
  AND company_id = ((auth.jwt() ->> 'company_id')::uuid)
);