-- Create storage bucket for sneaker reference images
INSERT INTO storage.buckets (id, name, public) VALUES ('sneaker-references', 'sneaker-references', true);

-- Allow anyone to upload images (for the public form)
CREATE POLICY "Anyone can upload sneaker references"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sneaker-references');

-- Allow anyone to view images
CREATE POLICY "Anyone can view sneaker references"
ON storage.objects FOR SELECT
USING (bucket_id = 'sneaker-references');

-- Allow admins to delete images
CREATE POLICY "Admins can delete sneaker references"
ON storage.objects FOR DELETE
USING (bucket_id = 'sneaker-references' AND public.is_admin());

-- Create order_requests table for client submissions
CREATE TABLE public.order_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Client info
  client_name VARCHAR NOT NULL,
  client_cpf VARCHAR NOT NULL,
  client_email VARCHAR NOT NULL,
  client_phone VARCHAR NOT NULL,
  
  -- Address
  address_cep VARCHAR NOT NULL,
  address_street VARCHAR NOT NULL,
  address_number VARCHAR NOT NULL,
  address_complement VARCHAR,
  address_neighborhood VARCHAR NOT NULL,
  address_city VARCHAR NOT NULL,
  address_state VARCHAR(2) NOT NULL,
  
  -- Product info
  shoe_size VARCHAR NOT NULL,
  product_brand VARCHAR,
  product_model VARCHAR,
  product_color VARCHAR,
  product_link TEXT,
  reference_image_url TEXT,
  additional_notes TEXT,
  
  -- Status
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'converted', 'rejected')),
  admin_notes TEXT,
  converted_order_id VARCHAR,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
);

-- Enable RLS
ALTER TABLE public.order_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public form)
CREATE POLICY "Anyone can submit order requests"
ON public.order_requests FOR INSERT
WITH CHECK (true);

-- Only admins can view requests
CREATE POLICY "Admins can view all order requests"
ON public.order_requests FOR SELECT
USING (public.is_admin());

-- Only admins can update requests
CREATE POLICY "Admins can update order requests"
ON public.order_requests FOR UPDATE
USING (public.is_admin());

-- Only admins can delete requests
CREATE POLICY "Admins can delete order requests"
ON public.order_requests FOR DELETE
USING (public.is_admin());