import { supabase } from "@/integrations/supabase/client";

// Map order status to email type
const STATUS_EMAIL_MAP: Record<string, string> = {
  // New status flow
  BUDGET_SENT: "budget_sent",
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
  INTERNATIONAL_DISPATCH: "international_dispatch",
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
    return { success: true };
  } catch (err: any) {
    console.error("Failed to process referral reward:", err);
    return { success: false, error: err.message };
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

  // Process referral reward when order is fully paid
  if (newStatus === "FULLY_PAID") {
    processReferralReward(orderData.order_id);
  }

  return {
    email: emailResult.success,
    whatsapp: whatsappResult.success,
  };
}
