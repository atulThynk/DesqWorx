/*
  # Enable employee deletion and credit management
  
  1. Changes
    - Add cascade delete for employee records
    - Update company credit management
*/

-- Ensure cascade delete is enabled for employees
ALTER TABLE employees
DROP CONSTRAINT IF EXISTS employees_company_id_fkey,
ADD CONSTRAINT employees_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Add function to update company credits
CREATE OR REPLACE FUNCTION update_company_credits(
  company_id UUID,
  new_credits INTEGER
) RETURNS void AS $$
BEGIN
  UPDATE companies
  SET credits = new_credits
  WHERE id = company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;