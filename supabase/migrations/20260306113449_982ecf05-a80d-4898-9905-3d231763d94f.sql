INSERT INTO system_settings (key, value, description)
VALUES (
  'installment_rates',
  '{"1":0,"2":0.0964,"3":0.1123,"4":0.1136,"5":0.1431,"6":0.1432,"7":0.1672,"8":0.1673,"9":0.1969,"10":0.2065,"11":0.2066,"12":0.2211}',
  'Taxas de juros por número de parcelas MercadoPago'
) ON CONFLICT (key) DO NOTHING;