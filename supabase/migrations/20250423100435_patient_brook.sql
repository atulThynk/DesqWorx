/*
  # Add credit history tracking and attendance history

  1. New Tables
    - `credit_transactions` - Tracks credit changes for companies
    - `attendance_history` - Tracks attendance status changes
  
  2. Security
    - Enable RLS on new tables
    - Add appropriate policies
*/

-- Create credit transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  previous_balance INTEGER NOT NULL,
  new_balance INTEGER NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create attendance history table
CREATE TABLE IF NOT EXISTS attendance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  previous_status TEXT NOT NULL CHECK (previous_status IN ('present', 'absent')),
  new_status TEXT NOT NULL CHECK (new_status IN ('present', 'absent')),
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_company_id ON credit_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_attendance_history_attendance_id ON attendance_history(attendance_id);
CREATE INDEX IF NOT EXISTS idx_attendance_history_created_at ON attendance_history(created_at);

-- Enable RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow credit transaction viewing"
ON credit_transactions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow attendance history viewing"
ON attendance_history
FOR SELECT
TO authenticated
USING (true);

-- Create function to record credit transaction
CREATE OR REPLACE FUNCTION record_credit_transaction(
  p_company_id UUID,
  p_amount INTEGER,
  p_description TEXT,
  p_created_by UUID
) RETURNS void AS $$
DECLARE
  v_previous_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT credits INTO v_previous_balance
  FROM companies
  WHERE id = p_company_id;

  -- Calculate new balance
  v_new_balance := v_previous_balance + p_amount;

  -- Update company credits
  UPDATE companies
  SET credits = v_new_balance
  WHERE id = p_company_id;

  -- Record transaction
  INSERT INTO credit_transactions (
    company_id,
    amount,
    previous_balance,
    new_balance,
    description,
    created_by
  ) VALUES (
    p_company_id,
    p_amount,
    v_previous_balance,
    v_new_balance,
    p_description,
    p_created_by
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to record attendance change
CREATE OR REPLACE FUNCTION record_attendance_change(
  p_attendance_id UUID,
  p_new_status TEXT,
  p_changed_by UUID
) RETURNS void AS $$
DECLARE
  v_previous_status TEXT;
BEGIN
  -- Get current status
  SELECT status INTO v_previous_status
  FROM attendance
  WHERE id = p_attendance_id;

  -- Update attendance status
  UPDATE attendance
  SET status = p_new_status
  WHERE id = p_attendance_id;

  -- Record change
  INSERT INTO attendance_history (
    attendance_id,
    previous_status,
    new_status,
    changed_by
  ) VALUES (
    p_attendance_id,
    v_previous_status,
    p_new_status,
    p_changed_by
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;