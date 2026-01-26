-- Create notification type enum
CREATE TYPE public.notification_type AS ENUM (
  'new_order_request',
  'order_status_update',
  'budget_sent',
  'budget_approved',
  'budget_rejected',
  'payment_received',
  'order_delivered',
  'system_alert'
);

-- Create notification target enum
CREATE TYPE public.notification_target AS ENUM ('admin', 'client');

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target notification_target NOT NULL,
  target_user_id UUID NULL, -- For admin notifications (references auth.users)
  target_client_cpf VARCHAR NULL, -- For client notifications
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  reference_id VARCHAR NULL, -- order_id, request_id, etc.
  reference_type VARCHAR NULL, -- 'order', 'order_request', etc.
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX idx_notifications_target_admin ON public.notifications(target_user_id) WHERE target = 'admin';
CREATE INDEX idx_notifications_target_client ON public.notifications(target_client_cpf) WHERE target = 'client';
CREATE INDEX idx_notifications_unread ON public.notifications(read) WHERE read = false;

-- RLS Policies
-- Admins can view all admin notifications
CREATE POLICY "Admins can view admin notifications"
ON public.notifications
FOR SELECT
USING (target = 'admin' AND is_admin());

-- Admins can update (mark as read) admin notifications
CREATE POLICY "Admins can update admin notifications"
ON public.notifications
FOR UPDATE
USING (target = 'admin' AND is_admin());

-- Admins can insert notifications (for system-generated notifications via edge functions)
CREATE POLICY "Service role can manage notifications"
ON public.notifications
FOR ALL
USING (false)
WITH CHECK (false);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;