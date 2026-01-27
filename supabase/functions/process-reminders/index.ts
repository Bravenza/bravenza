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
        // Handle cashback expiring reminders (not tied to an order)
        if (reminder.reminder_type === "cashback_expiring") {
          // Get referral data using the order_id field (which stores referral_id for this type)
          const { data: referral, error: referralError } = await supabase
            .from("referrals")
            .select("*")
            .eq("id", reminder.order_id)
            .single();

          if (referralError || !referral) {
            console.log(`Referral ${reminder.order_id} not found, marking reminder as failed`);
            await supabase
              .from("scheduled_reminders")
              .update({ 
                status: "failed", 
                last_error: "Indicação não encontrada",
                attempt_count: (reminder.attempt_count || 0) + 1
              })
              .eq("id", reminder.id);
            continue;
          }

          // Check if cashback was already used (cancel reminder)
          if (referral.discount_used) {
            console.log(`Cashback already used for referral ${referral.id}, cancelling reminder`);
            await supabase
              .from("scheduled_reminders")
              .update({ status: "cancelled" })
              .eq("id", reminder.id);
            continue;
          }

          // Check if cashback has already expired
          const expiresAt = new Date(new Date(referral.created_at).getTime() + 90 * 24 * 60 * 60 * 1000);
          if (expiresAt < new Date()) {
            console.log(`Cashback already expired for referral ${referral.id}, cancelling reminder`);
            await supabase
              .from("scheduled_reminders")
              .update({ status: "cancelled" })
              .eq("id", reminder.id);
            continue;
          }

          // Calculate days until expiration
          const daysUntilExpiration = Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

          // Get referrer's phone from their orders
          const { data: referrerOrder } = await supabase
            .from("orders")
            .select("client_phone")
            .eq("client_cpf", referral.referrer_cpf)
            .not("client_phone", "is", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          let emailSent = false;
          let whatsappSent = false;

          // Send email reminder
          if ((reminder.channel === "email" || reminder.channel === "both") && referral.referrer_email) {
            const { error: emailError } = await supabase.functions.invoke("send-order-email", {
              body: {
                type: "cashback_expiring",
                order_id: "CASHBACK",
                client_name: referral.referrer_name,
                client_email: referral.referrer_email,
                discount_percentage: referral.discount_percentage,
                days_until_expiration: daysUntilExpiration,
                cashback_amount: referral.discount_percentage,
              },
            });

            if (!emailError) {
              emailSent = true;
              console.log(`Cashback expiring email sent to ${referral.referrer_email}`);
            } else {
              console.error(`Email error for referral ${referral.id}:`, emailError);
            }
          }

          // Send WhatsApp reminder
          if ((reminder.channel === "whatsapp" || reminder.channel === "both") && referrerOrder?.client_phone) {
            const { error: whatsappError } = await supabase.functions.invoke("send-whatsapp", {
              body: {
                message_type: "cashback_expiring",
                referrer_phone: referrerOrder.client_phone,
                referrer_name: referral.referrer_name,
                discount_percentage: referral.discount_percentage,
                days_until_expiration: daysUntilExpiration,
                cashback_amount: referral.discount_percentage,
              },
            });

            if (!whatsappError) {
              whatsappSent = true;
              console.log(`Cashback expiring WhatsApp sent to ${referrerOrder.client_phone}`);
            } else {
              console.error(`WhatsApp error for referral ${referral.id}:`, whatsappError);
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

            results.push({ reminder_id: reminder.id, status: "sent", type: "cashback_expiring" });
          } else {
            await supabase
              .from("scheduled_reminders")
              .update({ 
                status: "failed", 
                last_error: "Nenhum canal de envio disponível",
                attempt_count: (reminder.attempt_count || 0) + 1
              })
              .eq("id", reminder.id);

            results.push({ reminder_id: reminder.id, status: "failed", type: "cashback_expiring" });
          }

          continue; // Move to next reminder
        }

        // Get order data (for order-based reminders)
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
