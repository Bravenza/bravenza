INSERT INTO system_settings (key, value, description)
VALUES (
  'vault_sla_config',
  '{"member":{"first_response":24,"update_frequency":72,"match_room_decision":6},"collector":{"first_response":12,"update_frequency":48,"match_room_decision":12},"elite":{"first_response":6,"update_frequency":24,"match_room_decision":24}}',
  'Prazos de SLA em horas por tier do Vault'
) ON CONFLICT (key) DO NOTHING;