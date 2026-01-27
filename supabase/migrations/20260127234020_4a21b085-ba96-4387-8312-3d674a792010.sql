-- Add client-specific notification types to the enum
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'cashback_available';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'cashback_expiring';