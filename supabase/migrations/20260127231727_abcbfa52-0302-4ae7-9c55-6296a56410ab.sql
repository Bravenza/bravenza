
-- Add missing updated_at triggers for tables that have updated_at column but no trigger

-- Check and add trigger for system_settings (it has updated_at column)
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Note: referrals and scheduled_reminders don't have updated_at columns, so no trigger needed
