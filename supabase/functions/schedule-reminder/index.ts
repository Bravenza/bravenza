import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireServiceOrAdmin, authErrorResponse } from "../_shared/auth-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-supabase-client-platform, apikey, content-type, x-cron-key",
};

interface ScheduleReminderRequest {
  order_id: string;
  reminder_type: "sinal_reminder" | "balance_reminder" | "budget_expiring" | "review_request";
  channel?: "email" | "whatsapp" | "both";
  delay_days?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      order_id, 
      reminder_type, 
      channel = "both", 
      delay_days = 3 
    }: ScheduleReminderRequest = await req.json();

    if (!order_id || !reminder_type) {
      throw new Error("order_id e reminder_type são obrigatórios");
    }

    // Calculate scheduled time
    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + delay_days);

    // Check if reminder already exists
    const { data: existing } = await supabase
      .from("scheduled_reminders")
      .select("id")
      .eq("order_id", order_id)
      .eq("reminder_type", reminder_type)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      console.log(`Reminder already scheduled for order ${order_id}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Lembrete já agendado",
          reminder_id: existing.id 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create reminder
    const { data: reminder, error } = await supabase
      .from("scheduled_reminders")
      .insert({
        order_id,
        reminder_type,
        channel,
        scheduled_for: scheduledFor.toISOString(),
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`Scheduled ${reminder_type} reminder for order ${order_id} at ${scheduledFor.toISOString()}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        reminder_id: reminder.id,
        scheduled_for: reminder.scheduled_for 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Schedule reminder error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      }
    );
  }
});
