/*
  # Fix user creation and RLS policies

  1. Changes
    - Add policy for anonymous users to create the initial super admin
    - Create a function to check if a user exists by email
    - Fix column name in policy existence check (policyname instead of polname)
  
  2. Security
    - Maintain security while allowing initial setup
    - Allow the super admin to be created once during initialization
*/

-- Check if the policy already exists before creating it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_catalog.pg_policies
        WHERE policyname = 'Allow initial super admin creation'
        AND tablename = 'users'
        AND schemaname = 'public'
    ) THEN
        -- Add policy to allow creation of the super admin during initial setup
        EXECUTE 'CREATE POLICY "Allow initial super admin creation" ON public.users FOR INSERT TO public WITH CHECK (email = ''admin@desqworx.com'' AND role = ''super_admin'')';
    END IF;
END
$$;

-- Create a function to check if a user exists by email
CREATE OR REPLACE FUNCTION public.user_exists_by_email(check_email text)
RETURNS boolean AS $$
DECLARE
  user_count integer;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.users WHERE email = check_email;
  RETURN user_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC functions for initial company setup
CREATE OR REPLACE FUNCTION public.create_initial_company(
  company_name text,
  temp_admin_id uuid
) RETURNS uuid AS $$
DECLARE
  company_id uuid;
BEGIN
  INSERT INTO public.companies (name, admin_id, credits, seat_price, seat_booking_limit)
  VALUES (company_name, temp_admin_id, 0, 0, 0)
  RETURNING id INTO company_id;
  
  RETURN company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update company admin
CREATE OR REPLACE FUNCTION public.update_company_admin(
  company_id uuid,
  admin_user_id uuid
) RETURNS void AS $$
BEGIN
  UPDATE public.companies
  SET admin_id = admin_user_id
  WHERE id = company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;