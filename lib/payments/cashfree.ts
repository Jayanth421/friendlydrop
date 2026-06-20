import { StoreSettings } from "@/types";

function getCFConfig(settings?: StoreSettings) {
  const appId = settings?.payments?.cashfreeAppId || process.env.CASHFREE_APP_ID;
  const secretKey = settings?.payments?.cashfreeSecretKey || process.env.CASHFREE_SECRET_KEY;
  const isSandbox = settings?.payments?.cashfreeSandboxMode !== undefined
    ? settings.payments.cashfreeSandboxMode
    : (process.env.CASHFREE_ENV !== "production");

  if (!appId || !secretKey) {
    throw new Error("Cashfree API keys are missing. Please configure them in the Admin Panel or environment variables.");
  }

  const baseUrl = isSandbox
    ? "https://sandbox.cashfree.com/pg"
    : "https://api.cashfree.com/pg";

  return { appId, secretKey, baseUrl, isSandbox };
}

export async function createCashfreeOrder(
  input: {
    orderId: string;
    amount: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    userId: string;
    returnUrl: string;
  },
  settings?: StoreSettings,
) {
  const { appId, secretKey, baseUrl } = getCFConfig(settings);

  // Normalize phone number: must be at least 10 digits
  let phone = input.customerPhone.replace(/\D/g, "");
  if (phone.length > 10) {
    phone = phone.slice(-10);
  }
  if (phone.length < 10) {
    phone = "9999999999"; // Fallback if invalid
  }

  const response = await fetch(`${baseUrl}/orders`, {
    method: "POST",
    headers: {
      "x-client-id": appId,
      "x-client-secret": secretKey,
      "x-api-version": "2023-08-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: Number(input.amount.toFixed(2)),
      order_currency: "INR",
      customer_details: {
        customer_id: input.userId,
        customer_name: input.customerName || "Customer",
        customer_email: input.customerEmail || "noreply@friendlydrop.in",
        customer_phone: phone,
      },
      order_meta: {
        return_url: input.returnUrl,
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Cashfree error: ${response.statusText}`);
  }

  return {
    paymentSessionId: data.payment_session_id as string,
    cfOrderId: data.cf_order_id as number,
    orderStatus: data.order_status as string,
    paymentLink: data.payment_link as string,
  };
}

export async function getCashfreeOrder(orderId: string, settings?: StoreSettings) {
  const { appId, secretKey, baseUrl } = getCFConfig(settings);

  const response = await fetch(`${baseUrl}/orders/${orderId}`, {
    method: "GET",
    headers: {
      "x-client-id": appId,
      "x-client-secret": secretKey,
      "x-api-version": "2023-08-01",
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Cashfree error: ${response.statusText}`);
  }

  return data;
}

export async function getCashfreeOrderPayments(orderId: string, settings?: StoreSettings) {
  const { appId, secretKey, baseUrl } = getCFConfig(settings);

  const response = await fetch(`${baseUrl}/orders/${orderId}/payments`, {
    method: "GET",
    headers: {
      "x-client-id": appId,
      "x-client-secret": secretKey,
      "x-api-version": "2023-08-01",
    },
  });

  const data = await response.json();
  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error(data.message || `Cashfree error: ${response.statusText}`);
  }

  return data;
}

export async function createCashfreeRefund(
  orderId: string,
  input: {
    amount: number;
    refundId: string;
    note?: string;
  },
  settings?: StoreSettings,
) {
  const { appId, secretKey, baseUrl } = getCFConfig(settings);

  const response = await fetch(`${baseUrl}/orders/${orderId}/refunds`, {
    method: "POST",
    headers: {
      "x-client-id": appId,
      "x-client-secret": secretKey,
      "x-api-version": "2023-08-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refund_amount: Number(input.amount.toFixed(2)),
      refund_id: input.refundId,
      refund_note: input.note || "Refund initiated via admin dashboard",
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Cashfree refund error: ${response.statusText}`);
  }

  return data;
}
