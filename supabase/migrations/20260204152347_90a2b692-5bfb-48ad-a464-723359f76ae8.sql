-- Add system settings for centralized configuration
INSERT INTO public.system_settings (key, value, description)
VALUES 
  ('whatsapp_number', '"5551981055425"', 'Número do WhatsApp para contato (formato internacional)'),
  ('whatsapp_message', '"Olá! Gostaria de saber mais sobre a BRAVENZA."', 'Mensagem padrão do WhatsApp'),
  ('public_base_url', '"https://bravenza.lovable.app"', 'URL base pública do site'),
  ('payment_fee_pix', '0.0099', 'Taxa de pagamento PIX (0.99%)'),
  ('payment_fee_credit_card', '0.0499', 'Taxa de pagamento Cartão de Crédito (4.99%)')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();