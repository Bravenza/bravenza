
-- Add seller_cep to vault_seller_profiles for freight calculation
ALTER TABLE public.vault_seller_profiles ADD COLUMN IF NOT EXISTS seller_cep VARCHAR(10);

-- Add Bravenza warehouse CEP to system settings
INSERT INTO public.system_settings (key, value, description)
VALUES ('bravenza_warehouse_cep', '"90040191"', 'CEP do armazém BRAVENZA VAULT em Porto Alegre/RS para cálculo de frete marketplace')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
