-- Create ENUMs for order types and statuses
CREATE TYPE public.order_type AS ENUM ('READY', 'VAULT');

CREATE TYPE public.order_status AS ENUM (
  'ORDER_CONFIRMED',
  'SOURCING',
  'NEGOTIATING',
  'PURCHASE_COMPLETED',
  'PACKAGE_EN_ROUTE',
  'ARRIVED',
  'INSPECTION_APPROVED',
  'BALANCE_DUE',
  'INTERNATIONAL_DISPATCH',
  'CUSTOMS',
  'NATIONAL_TRANSIT',
  'DISPATCHED',
  'DELIVERED'
);

-- Create orders table
CREATE TABLE public.orders (
  order_id VARCHAR(20) PRIMARY KEY,
  order_type public.order_type NOT NULL DEFAULT 'VAULT',
  current_status public.order_status NOT NULL DEFAULT 'ORDER_CONFIRMED',
  
  client_name VARCHAR(255) NOT NULL,
  client_cpf VARCHAR(14) NOT NULL,
  client_email VARCHAR(255),
  client_phone VARCHAR(20),
  client_address TEXT,
  
  product_name VARCHAR(255) NOT NULL,
  product_reference VARCHAR(100),
  product_price DECIMAL(12,2),
  product_currency VARCHAR(3) DEFAULT 'BRL',
  
  sinal_value DECIMAL(12,2),
  sinal_paid BOOLEAN DEFAULT FALSE,
  sinal_proof_url TEXT,
  balance_value DECIMAL(12,2),
  balance_paid BOOLEAN DEFAULT FALSE,
  balance_proof_url TEXT,
  
  international_tracking VARCHAR(100),
  national_tracking VARCHAR(100),
  national_carrier VARCHAR(50),
  
  sla_vault_due_date DATE,
  balance_due_date TIMESTAMP WITH TIME ZONE,
  
  internal_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_history table
CREATE TABLE public.order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(20) NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
  status public.order_status NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name VARCHAR(255),
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check admin role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- RLS Policies for orders (admins can do everything)
CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete orders"
  ON public.orders FOR DELETE
  USING (public.is_admin());

-- RLS Policies for order_history
CREATE POLICY "Admins can view all order history"
  ON public.order_history FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert order history"
  ON public.order_history FOR INSERT
  WITH CHECK (public.is_admin());

-- RLS Policies for user_roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function for public order tracking (no auth required)
CREATE OR REPLACE FUNCTION public.track_order(p_order_id VARCHAR, p_cpf VARCHAR)
RETURNS TABLE (
  order_id VARCHAR,
  order_type public.order_type,
  current_status public.order_status,
  client_name VARCHAR,
  product_name VARCHAR,
  product_reference VARCHAR,
  sla_vault_due_date DATE,
  balance_due_date TIMESTAMP WITH TIME ZONE,
  international_tracking VARCHAR,
  national_tracking VARCHAR,
  national_carrier VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.order_id,
    o.order_type,
    o.current_status,
    o.client_name,
    o.product_name,
    o.product_reference,
    o.sla_vault_due_date,
    o.balance_due_date,
    o.international_tracking,
    o.national_tracking,
    o.national_carrier,
    o.created_at
  FROM public.orders o
  WHERE o.order_id = p_order_id
    AND o.client_cpf = p_cpf
$$;

-- Function to get order history for tracking
CREATE OR REPLACE FUNCTION public.get_order_history(p_order_id VARCHAR, p_cpf VARCHAR)
RETURNS TABLE (
  status public.order_status,
  notes TEXT,
  history_timestamp TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    oh.status,
    oh.notes,
    oh.created_at
  FROM public.order_history oh
  INNER JOIN public.orders o ON o.order_id = oh.order_id
  WHERE oh.order_id = p_order_id
    AND o.client_cpf = p_cpf
  ORDER BY oh.created_at ASC
$$;