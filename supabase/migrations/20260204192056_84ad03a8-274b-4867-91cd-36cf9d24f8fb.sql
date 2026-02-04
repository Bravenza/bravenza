-- Create client_profiles table to link authenticated users to CPF
CREATE TABLE public.client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone VARCHAR(15),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON public.client_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.client_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
ON public.client_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create function to get client data by authenticated user
CREATE OR REPLACE FUNCTION public.get_client_profile()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  cpf VARCHAR(11),
  full_name TEXT,
  phone VARCHAR(15),
  vault_member_id UUID,
  vault_tier TEXT,
  vault_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.user_id,
    cp.cpf,
    cp.full_name,
    cp.phone,
    vm.id as vault_member_id,
    vm.tier::TEXT as vault_tier,
    vm.status::TEXT as vault_status
  FROM client_profiles cp
  LEFT JOIN vault_members vm ON vm.client_cpf = cp.cpf
  WHERE cp.user_id = auth.uid();
END;
$$;

-- Create function to get orders for authenticated client
CREATE OR REPLACE FUNCTION public.get_client_orders()
RETURNS SETOF orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  client_cpf_val VARCHAR(11);
BEGIN
  SELECT cpf INTO client_cpf_val FROM client_profiles WHERE user_id = auth.uid();
  
  IF client_cpf_val IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT * FROM orders WHERE client_cpf = client_cpf_val ORDER BY created_at DESC;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_client_profiles_updated_at
BEFORE UPDATE ON public.client_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();