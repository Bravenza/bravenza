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

interface OrderEmailData {
  order_id: string;
  client_name: string;
  client_email: string | null;
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
