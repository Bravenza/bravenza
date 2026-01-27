import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-supabase-client-platform, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Processing pending reminders...");

    // Get pending reminders that are due
    const { data: reminders, error: reminderError } = await supabase
      .from("scheduled_reminders")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(50);

    if (reminderError) throw reminderError;

    console.log(`Found ${reminders?.length || 0} pending reminders`);

    const results = [];

    for (const reminder of reminders || []) {
      try {
        // Get order data
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("order_id", reminder.order_id)
          .single();

        if (orderError || !order) {
          console.log(`Order ${reminder.order_id} not found, marking reminder as failed`);
          await supabase
            .from("scheduled_reminders")
            .update({ 
              status: "failed", 
              last_error: "Pedido não encontrado",
              attempt_count: (reminder.attempt_count || 0) + 1
            })
            .eq("id", reminder.id);
          continue;
        }

        // Check if payment was already made (cancel reminder)
        if (reminder.reminder_type === "balance_reminder" && order.balance_paid) {
          console.log(`Balance already paid for ${reminder.order_id}, cancelling reminder`);
          await supabase
            .from("scheduled_reminders")
            .update({ status: "cancelled" })
            .eq("id", reminder.id);
          continue;
        }

        if (reminder.reminder_type === "sinal_reminder" && order.sinal_paid) {
          console.log(`Sinal already paid for ${reminder.order_id}, cancelling reminder`);
          await supabase
            .from("scheduled_reminders")
            .update({ status: "cancelled" })
            .eq("id", reminder.id);
          continue;
        }

        // Check if review was already submitted (for review reminders)
        if (reminder.reminder_type === "review_request") {
          const { data: existingReview } = await supabase
            .from("reviews")
            .select("id")
            .eq("order_id", order.order_id)
            .maybeSingle();

          if (existingReview) {
            console.log(`Review already submitted for ${reminder.order_id}, cancelling reminder`);
            await supabase
              .from("scheduled_reminders")
              .update({ status: "cancelled" })
              .eq("id", reminder.id);
            continue;
          }
        }

        let emailSent = false;
        let whatsappSent = false;

        // Send email reminder
        if (reminder.channel === "email" || reminder.channel === "both") {
          if (order.client_email) {
            const reviewLink = `https://bravenza.com.br/minha-conta`;
            const paymentLink = `https://bravenza.com.br/pagamento/${order.budget_approval_token}`;
            
            // Determine email type based on reminder type
            const emailType = reminder.reminder_type === "review_request" ? "review_request" : "balance_reminder";
            
            const { error: emailError } = await supabase.functions.invoke("send-order-email", {
              body: {
                type: emailType,
                order_id: order.order_id,
                client_name: order.client_name,
                client_email: order.client_email,
                product_name: order.product_name,
                balance_value: order.balance_value,
                payment_link: paymentLink,
                review_link: reviewLink,
              },
            });

            if (!emailError) {
              emailSent = true;
              console.log(`Email ${emailType} sent for ${reminder.order_id}`);
            } else {
              console.error(`Email error for ${reminder.order_id}:`, emailError);
            }
          }
        }

        // Send WhatsApp reminder
        if (reminder.channel === "whatsapp" || reminder.channel === "both") {
          if (order.client_phone) {
            // Determine message type based on reminder type
            if (reminder.reminder_type === "review_request") {
              const { error: whatsappError } = await supabase.functions.invoke("send-whatsapp", {
                body: {
                  order_id: order.order_id,
                  message_type: "review_request",
                },
              });

              if (!whatsappError) {
                whatsappSent = true;
                console.log(`WhatsApp review request sent for ${reminder.order_id}`);
              } else {
                console.error(`WhatsApp error for ${reminder.order_id}:`, whatsappError);
              }
            } else {
              const { error: whatsappError } = await supabase.functions.invoke("send-whatsapp", {
                body: {
                  order_id: order.order_id,
                  message_type: "custom",
                  custom_message: 
                    `⏰ *Lembrete de Pagamento*\n\n` +
                    `Olá ${order.client_name.split(" ")[0]}!\n\n` +
                    `Seu produto *${order.product_name}* está aguardando o pagamento do saldo para ser enviado.\n\n` +
                    `💰 Valor: R$ ${order.balance_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
                    `Acesse sua conta para pagar: https://bravenza.com.br/minha-conta\n\n` +
                    `_Bravenza - Sua loja de sneakers premium_`,
                },
              });

              if (!whatsappError) {
                whatsappSent = true;
                console.log(`WhatsApp reminder sent for ${reminder.order_id}`);
              } else {
                console.error(`WhatsApp error for ${reminder.order_id}:`, whatsappError);
              }
            }
          }
        }

        // Update reminder status
        if (emailSent || whatsappSent) {
          await supabase
            .from("scheduled_reminders")
            .update({ 
              status: "sent", 
              sent_at: new Date().toISOString(),
              attempt_count: (reminder.attempt_count || 0) + 1
            })
            .eq("id", reminder.id);

          results.push({ reminder_id: reminder.id, status: "sent" });
        } else {
          await supabase
            .from("scheduled_reminders")
            .update({ 
              status: "failed", 
              last_error: "Nenhum canal de envio disponível",
              attempt_count: (reminder.attempt_count || 0) + 1
            })
            .eq("id", reminder.id);

          results.push({ reminder_id: reminder.id, status: "failed" });
        }

      } catch (err: any) {
        console.error(`Error processing reminder ${reminder.id}:`, err);
        await supabase
          .from("scheduled_reminders")
          .update({ 
            status: "failed", 
            last_error: err.message,
            attempt_count: (reminder.attempt_count || 0) + 1
          })
          .eq("id", reminder.id);

        results.push({ reminder_id: reminder.id, status: "failed", error: err.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Process reminders error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      }
    );
  }
});
