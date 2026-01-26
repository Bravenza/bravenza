-- Adicionar novos campos de produto para tênis importados
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS product_brand VARCHAR(100),
ADD COLUMN IF NOT EXISTS product_model VARCHAR(100),
ADD COLUMN IF NOT EXISTS product_size VARCHAR(20),
ADD COLUMN IF NOT EXISTS product_color VARCHAR(50),
ADD COLUMN IF NOT EXISTS product_link TEXT;

-- Adicionar comentários para documentar os campos
COMMENT ON COLUMN public.orders.product_brand IS 'Marca do tênis (Nike, Adidas, etc.)';
COMMENT ON COLUMN public.orders.product_model IS 'Modelo específico do tênis';
COMMENT ON COLUMN public.orders.product_size IS 'Tamanho do tênis (ex: 42, 10 US)';
COMMENT ON COLUMN public.orders.product_color IS 'Cor/colorway do tênis';
COMMENT ON COLUMN public.orders.product_link IS 'Link de referência do produto';