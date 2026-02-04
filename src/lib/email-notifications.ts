import { supabase } from "@/integrations/supabase/client";

// Map order status to email type
const STATUS_EMAIL_MAP: Record<string, string> = {
  // New status flow
  BUDGET_SENT: "budget_sent",
  BUDGET_APPROVED: "budget_approved",
  DEPOSIT_CONFIRMED: "sinal_confirmed",
  PRODUCT_FOUND: "product_found",
  PREPARING_INTERNATIONAL: "package_shipped",
  INTERNATIONAL_TRANSIT: "package_shipped",
  ARRIVED_BRAZIL: "arrived_brazil",
  PRODUCT_INSPECTED: "inspection_approved",
  BALANCE_PENDING: "balance_due",
  FULLY_PAID: "balance_confirmed",
  SHIPPED_TO_CLIENT: "dispatched",
  DELIVERED: "delivered",
  // Legacy status mappings for backward compatibility
  SOURCING: "product_found",
  PURCHASE_COMPLETED: "product_found",
  PACKAGE_EN_ROUTE: "package_shipped",
  INSPECTION_APPROVED: "inspection_approved",
  BALANCE_DUE: "balance_due",
  INTERNATIONAL_DISPATCH: "dispatched",
  DISPATCHED: "dispatched",
};

// Map order status to WhatsApp message type
const STATUS_WHATSAPP_MAP: Record<string, string> = {
  DEPOSIT_CONFIRMED: "sinal_confirmed",
  FULLY_PAID: "balance_confirmed",
  SHIPPED_TO_CLIENT: "status_update",
  DELIVERED: "status_update",
};

interface OrderEmailData {
  order_id: string;
  client_name: string;
  client_email: string | null;
  client_phone?: string | null;
  product_name: string;
  product_price?: number | null;
  sinal_value?: number | null;
  balance_value?: number | null;
  international_tracking?: string | null;
  national_tracking?: string | null;
  national_carrier?: string | null;
}

export async function sendStatusChangeEmail(
  newStatus: string,
  orderData: OrderEmailData
): Promise<{ success: boolean; error?: string }> {
  // Check if this status should trigger an email
  const emailType = STATUS_EMAIL_MAP[newStatus];
  
  if (!emailType) {
    console.log(`No email configured for status: ${newStatus}`);
    return { success: true };
  }

  // Skip if no client email
  if (!orderData.client_email) {
    console.log(`No email for order ${orderData.order_id}, skipping notification`);
    return { success: true };
  }

  // Generate review link for delivered orders
  const reviewLink = `https://bravenza.com.br/minha-conta`;

  try {
    const { data, error } = await supabase.functions.invoke("send-order-email", {
      body: {
        type: emailType,
        order_id: orderData.order_id,
        client_name: orderData.client_name,
        client_email: orderData.client_email,
        product_name: orderData.product_name,
        total_price: orderData.product_price,
        sinal_value: orderData.sinal_value,
        balance_value: orderData.balance_value,
        tracking_code: orderData.international_tracking || orderData.national_tracking,
        carrier: orderData.national_carrier,
        review_link: reviewLink,
      },
    });

    if (error) {
      console.error("Error sending status email:", error);
      return { success: false, error: error.message };
    }

    console.log(`Email sent for ${emailType} to ${orderData.client_email}`);
    return { success: true };
  } catch (err: any) {
    console.error("Failed to send status email:", err);
    return { success: false, error: err.message };
  }
}

export async function sendStatusChangeWhatsApp(
  newStatus: string,
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  // Check if this status should trigger a WhatsApp message
  const messageType = STATUS_WHATSAPP_MAP[newStatus];
  
  if (!messageType) {
    return { success: true };
  }

  try {
    const { data, error } = await supabase.functions.invoke("send-whatsapp", {
      body: {
        order_id: orderId,
        message_type: messageType,
      },
    });

    if (error) {
      console.error("Error sending WhatsApp:", error);
      return { success: false, error: error.message };
    }

    console.log(`WhatsApp sent for ${messageType} on order ${orderId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Failed to send WhatsApp:", err);
    return { success: false, error: err.message };
  }
}

export async function sendPaymentConfirmationEmail(
  paymentType: "sinal" | "balance",
  orderData: OrderEmailData
): Promise<{ success: boolean; error?: string }> {
  if (!orderData.client_email) {
    return { success: true };
  }

  const emailType = paymentType === "sinal" ? "sinal_confirmed" : "balance_confirmed";

  try {
    const { data, error } = await supabase.functions.invoke("send-order-email", {
      body: {
        type: emailType,
        order_id: orderData.order_id,
        client_name: orderData.client_name,
        client_email: orderData.client_email,
        product_name: orderData.product_name,
        total_price: orderData.product_price,
        sinal_value: orderData.sinal_value,
        balance_value: orderData.balance_value,
      },
    });

    if (error) {
      console.error("Error sending payment email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Process referral reward when a referred order is fully paid
export async function processReferralReward(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Find if this order was made via referral
    const { data: referral, error: referralError } = await supabase
      .from("referrals")
      .select("*")
      .eq("referred_order_id", orderId)
      .eq("status", "converted")
      .maybeSingle();

    if (referralError) {
      console.error("Error finding referral:", referralError);
      return { success: false, error: referralError.message };
    }

    if (!referral) {
      // No referral found for this order, that's fine
      return { success: true };
    }

    // Mark the referral as rewarded - the referrer now has a discount available
    const { error: updateError } = await supabase
      .from("referrals")
      .update({
        status: "rewarded",
      })
      .eq("id", referral.id);

    if (updateError) {
      console.error("Error updating referral to rewarded:", updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`Referral reward processed for ${referral.referrer_name} (${referral.discount_percentage}% discount)`);

    // Send notification to the referrer about the confirmed referral
    await sendReferralConfirmationNotifications(referral);

    // Schedule cashback expiration reminder for 7 days before expiration (83 days from now)
    try {
      await scheduleCashbackExpirationReminder(referral.id);
    } catch (err) {
      console.error("Failed to schedule cashback expiration reminder:", err);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to process referral reward:", err);
    return { success: false, error: err.message };
  }
}

// Send referral confirmation notifications (email + WhatsApp) to the referrer
async function sendReferralConfirmationNotifications(referral: {
  referrer_name: string;
  referrer_email?: string | null;
  referrer_cpf: string;
  referred_name?: string | null;
  discount_percentage?: number | null;
  referral_code: string;
}): Promise<void> {
  try {
    // Get referrer's phone from their orders
    const { data: referrerOrder } = await supabase
      .from("orders")
      .select("client_phone")
      .eq("client_cpf", referral.referrer_cpf)
      .not("client_phone", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Send email notification
    if (referral.referrer_email) {
      try {
        await supabase.functions.invoke("send-order-email", {
          body: {
            type: "referral_confirmed",
            order_id: "REFERRAL",
            client_name: referral.referrer_name,
            client_email: referral.referrer_email,
            referred_name: referral.referred_name || "seu indicado",
            discount_percentage: referral.discount_percentage || 5,
            referral_code: referral.referral_code,
          },
        });
        console.log(`Referral confirmation email sent to ${referral.referrer_email}`);
      } catch (emailErr) {
        console.error("Failed to send referral email:", emailErr);
      }
    }

    // Send WhatsApp notification
    if (referrerOrder?.client_phone) {
      try {
        await supabase.functions.invoke("send-whatsapp", {
          body: {
            message_type: "referral_confirmed",
            referrer_phone: referrerOrder.client_phone,
            referrer_name: referral.referrer_name,
            referred_name: referral.referred_name || "seu indicado",
            discount_percentage: referral.discount_percentage || 5,
            referral_code: referral.referral_code,
          },
        });
        console.log(`Referral confirmation WhatsApp sent to ${referrerOrder.client_phone}`);
      } catch (whatsappErr) {
        console.error("Failed to send referral WhatsApp:", whatsappErr);
      }
    }
  } catch (err) {
    console.error("Error sending referral notifications:", err);
  }
}

// Schedule cashback expiration reminder (7 days before expiration = 83 days after creation)
async function scheduleCashbackExpirationReminder(referralId: string): Promise<void> {
  try {
    // Calculate the date 83 days from now (7 days before the 90-day expiration)
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 83);

    // Check if a reminder already exists for this referral
    const { data: existingReminder } = await supabase
      .from("scheduled_reminders")
      .select("id")
      .eq("order_id", referralId) // Using order_id field to store referral_id
      .eq("reminder_type", "cashback_expiring")
      .maybeSingle();

    if (existingReminder) {
      console.log(`Cashback expiration reminder already scheduled for referral ${referralId}`);
      return;
    }

    // Create the scheduled reminder
    const { error } = await supabase
      .from("scheduled_reminders")
      .insert({
        order_id: referralId, // Storing referral_id in order_id field
        reminder_type: "cashback_expiring",
        channel: "both",
        scheduled_for: reminderDate.toISOString(),
        status: "pending",
      });

    if (error) {
      console.error("Error scheduling cashback expiration reminder:", error);
      return;
    }

    console.log(`Cashback expiration reminder scheduled for referral ${referralId} on ${reminderDate.toISOString()}`);
  } catch (err) {
    console.error("Failed to schedule cashback expiration reminder:", err);
  }
}

// Send all notifications for a status change (email + WhatsApp)
export async function sendAllStatusNotifications(
  newStatus: string,
  orderData: OrderEmailData
): Promise<{ email: boolean; whatsapp: boolean }> {
  const [emailResult, whatsappResult] = await Promise.all([
    sendStatusChangeEmail(newStatus, orderData),
    sendStatusChangeWhatsApp(newStatus, orderData.order_id),
  ]);

  // Schedule budget expiring reminder when budget is sent (2 days later = 1 day before 3-day expiration)
  if (newStatus === "BUDGET_SENT") {
    try {
      await supabase.functions.invoke("schedule-reminder", {
        body: {
          order_id: orderData.order_id,
          reminder_type: "budget_expiring",
          channel: "both",
          delay_days: 2,
        },
      });
      console.log(`Budget expiring reminder scheduled for order ${orderData.order_id}`);
    } catch (err) {
      console.error("Failed to schedule budget expiring reminder:", err);
    }
  }

  // Schedule sinal payment reminder when budget is approved (2 days after)
  if (newStatus === "BUDGET_APPROVED") {
    try {
      await supabase.functions.invoke("schedule-reminder", {
        body: {
          order_id: orderData.order_id,
          reminder_type: "sinal_reminder",
          channel: "both",
          delay_days: 2,
        },
      });
      console.log(`Sinal reminder scheduled for order ${orderData.order_id}`);
    } catch (err) {
      console.error("Failed to schedule sinal reminder:", err);
    }
  }

  // Schedule payment reminders for balance pending status
  if (newStatus === "BALANCE_PENDING" || newStatus === "BALANCE_DUE") {
    try {
      await supabase.functions.invoke("schedule-reminder", {
        body: {
          order_id: orderData.order_id,
          reminder_type: "balance_reminder",
          channel: "both",
          delay_days: 3,
        },
      });
      console.log(`Payment reminder scheduled for order ${orderData.order_id}`);
    } catch (err) {
      console.error("Failed to schedule payment reminder:", err);
    }
  }

  // Schedule review request reminder when order is delivered
  if (newStatus === "DELIVERED") {
    try {
      await supabase.functions.invoke("schedule-reminder", {
        body: {
          order_id: orderData.order_id,
          reminder_type: "review_request",
          channel: "both",
          delay_days: 3, // Send review request 3 days after delivery
        },
      });
      console.log(`Review request scheduled for order ${orderData.order_id}`);
    } catch (err) {
      console.error("Failed to schedule review request:", err);
    }
  }

  // Process referral reward when order is fully paid
  if (newStatus === "FULLY_PAID") {
    processReferralReward(orderData.order_id);
  }

  return {
    email: emailResult.success,
    whatsapp: whatsappResult.success,
  };
}

// Send Vault Club welcome notification (email + WhatsApp)
export async function sendVaultWelcomeNotification(
  memberName: string,
  memberEmail: string | null,
  memberPhone: string | null,
  memberTier: string = "Vault Access"
): Promise<{ email: boolean; whatsapp: boolean }> {
  let emailSent = false;
  let whatsappSent = false;

  // Send email
  if (memberEmail) {
    try {
      const { error } = await supabase.functions.invoke("send-order-email", {
        body: {
          type: "vault_welcome",
          order_id: "VAULT",
          client_name: memberName,
          client_email: memberEmail,
        },
      });

      if (!error) {
        emailSent = true;
        console.log(`Vault welcome email sent to ${memberEmail}`);
      } else {
        console.error("Error sending vault welcome email:", error);
      }
    } catch (err) {
      console.error("Failed to send vault welcome email:", err);
    }
  }

  // Send WhatsApp
  if (memberPhone) {
    try {
      const { error } = await supabase.functions.invoke("send-whatsapp", {
        body: {
          message_type: "vault_welcome",
          member_name: memberName,
          member_phone: memberPhone,
          member_tier: memberTier,
        },
      });

      if (!error) {
        whatsappSent = true;
        console.log(`Vault welcome WhatsApp sent to ${memberPhone}`);
      } else {
        console.error("Error sending vault welcome WhatsApp:", error);
      }
    } catch (err) {
      console.error("Failed to send vault welcome WhatsApp:", err);
    }
  }

  return {
    email: emailSent,
    whatsapp: whatsappSent,
  };
}
