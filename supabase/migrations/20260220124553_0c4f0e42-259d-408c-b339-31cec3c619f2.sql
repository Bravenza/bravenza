
-- Field-Level Encryption for PII Data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt function
CREATE OR REPLACE FUNCTION public.encrypt_pii(plaintext TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF plaintext IS NULL OR plaintext = '' THEN RETURN plaintext; END IF;
  RETURN encode(pgp_sym_encrypt(plaintext, 'bravenza-pii-encryption-v1-key'), 'base64');
END;
$$;

-- Decrypt function
CREATE OR REPLACE FUNCTION public.decrypt_pii(ciphertext TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF ciphertext IS NULL OR ciphertext = '' THEN RETURN ciphertext; END IF;
  BEGIN
    RETURN pgp_sym_decrypt(decode(ciphertext, 'base64'), 'bravenza-pii-encryption-v1-key');
  EXCEPTION WHEN OTHERS THEN
    RETURN ciphertext;
  END;
END;
$$;

-- Mask CPF
CREATE OR REPLACE FUNCTION public.mask_cpf(cpf_value TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
BEGIN
  IF cpf_value IS NULL OR length(cpf_value) < 4 THEN RETURN '***'; END IF;
  RETURN '***.' || substring(cpf_value from length(cpf_value) - 3);
END;
$$;

-- Add encrypted columns
ALTER TABLE public.vault_seller_profiles 
  ADD COLUMN IF NOT EXISTS cpf_cnpj_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS pix_key_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS id_front_url_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS id_back_url_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS id_selfie_url_encrypted TEXT;

-- Migrate existing data
UPDATE public.vault_seller_profiles
SET 
  cpf_cnpj_encrypted = CASE WHEN cpf_cnpj IS NOT NULL AND cpf_cnpj != '' THEN encrypt_pii(cpf_cnpj) ELSE NULL END,
  pix_key_encrypted = CASE WHEN pix_key IS NOT NULL AND pix_key != '' THEN encrypt_pii(pix_key) ELSE NULL END,
  id_front_url_encrypted = CASE WHEN id_front_url IS NOT NULL AND id_front_url != '' THEN encrypt_pii(id_front_url) ELSE NULL END,
  id_back_url_encrypted = CASE WHEN id_back_url IS NOT NULL AND id_back_url != '' THEN encrypt_pii(id_back_url) ELSE NULL END,
  id_selfie_url_encrypted = CASE WHEN id_selfie_url IS NOT NULL AND id_selfie_url != '' THEN encrypt_pii(id_selfie_url) ELSE NULL END
WHERE cpf_cnpj IS NOT NULL OR pix_key IS NOT NULL OR id_front_url IS NOT NULL;

-- Auto-encrypt trigger
CREATE OR REPLACE FUNCTION public.auto_encrypt_seller_pii()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  IF NEW.cpf_cnpj IS NOT NULL AND NEW.cpf_cnpj != '' AND (OLD IS NULL OR NEW.cpf_cnpj IS DISTINCT FROM OLD.cpf_cnpj) THEN
    NEW.cpf_cnpj_encrypted := encrypt_pii(NEW.cpf_cnpj);
  END IF;
  IF NEW.pix_key IS NOT NULL AND NEW.pix_key != '' AND (OLD IS NULL OR NEW.pix_key IS DISTINCT FROM OLD.pix_key) THEN
    NEW.pix_key_encrypted := encrypt_pii(NEW.pix_key);
  END IF;
  IF NEW.id_front_url IS NOT NULL AND NEW.id_front_url != '' AND (OLD IS NULL OR NEW.id_front_url IS DISTINCT FROM OLD.id_front_url) THEN
    NEW.id_front_url_encrypted := encrypt_pii(NEW.id_front_url);
  END IF;
  IF NEW.id_back_url IS NOT NULL AND NEW.id_back_url != '' AND (OLD IS NULL OR NEW.id_back_url IS DISTINCT FROM OLD.id_back_url) THEN
    NEW.id_back_url_encrypted := encrypt_pii(NEW.id_back_url);
  END IF;
  IF NEW.id_selfie_url IS NOT NULL AND NEW.id_selfie_url != '' AND (OLD IS NULL OR NEW.id_selfie_url IS DISTINCT FROM OLD.id_selfie_url) THEN
    NEW.id_selfie_url_encrypted := encrypt_pii(NEW.id_selfie_url);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_encrypt_seller_pii ON public.vault_seller_profiles;
CREATE TRIGGER trg_auto_encrypt_seller_pii
  BEFORE INSERT OR UPDATE ON public.vault_seller_profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_encrypt_seller_pii();
