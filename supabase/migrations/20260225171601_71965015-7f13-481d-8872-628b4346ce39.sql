
-- Create client addresses table
CREATE TABLE public.client_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  label TEXT NOT NULL DEFAULT 'Casa',
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  cep TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own addresses"
  ON public.client_addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses"
  ON public.client_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses"
  ON public.client_addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses"
  ON public.client_addresses FOR DELETE
  USING (auth.uid() = user_id);

-- Function to ensure only one default address per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.client_addresses
    SET is_default = false, updated_at = now()
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_ensure_single_default_address
  BEFORE INSERT OR UPDATE ON public.client_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_address();

-- Updated_at trigger
CREATE TRIGGER update_client_addresses_updated_at
  BEFORE UPDATE ON public.client_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
