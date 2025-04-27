/*
  # Add helper functions for initial admin setup

  1. New Functions
    - `create_initial_company` - Creates the initial company bypassing RLS
    - `update_company_admin` - Updates the company's admin_id bypassing RLS
  
  2. Security
    - Functions use SECURITY DEFINER to bypass RLS
*/

-- Function to create the initial company
CREATE OR REPLACE FUNCTION create_initial_company(company_name TEXT, temp_admin_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id UUID;
BEGIN
  INSERT INTO companies (name, admin_id, credits, seat_price, seat_booking_limit)
  VALUES (company_name, temp_admin_id, 0, 0, 0)
  RETURNING id INTO new_company_id;
  
  RETURN new_company_id;
END;
$$;

-- Function to update company admin ID
CREATE OR REPLACE FUNCTION update_company_admin(company_id UUID, admin_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE companies
  SET admin_id = admin_user_id
  WHERE id = company_id;
END;
$$;