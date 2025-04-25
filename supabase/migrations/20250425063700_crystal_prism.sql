/*
  # Create calls table for tracking Twilio calls

  1. New Tables
    - `calls`
      - `id` (uuid, primary key)
      - `call_sid` (text, unique) - Twilio call SID
      - `to_number` (text) - Recipient phone number
      - `from_number` (text) - Caller phone number
      - `status` (text) - Call status (pending, in-progress, completed, failed)
      - `duration` (integer) - Call duration in seconds
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `user_id` (uuid) - Reference to auth.users
  
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid text UNIQUE,
  to_number text NOT NULL,
  from_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  duration integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own calls"
  ON calls
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calls"
  ON calls
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calls"
  ON calls
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);