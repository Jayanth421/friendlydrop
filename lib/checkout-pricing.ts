export interface CheckoutSummaryInput {
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  deliveryFee: number;
}

export interface CheckoutSummary {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  deliveryFee: number;
  total: number;
}

function normalizeMoney(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(Math.round(value), 0);
}

export function calculateCheckoutSummary(input: CheckoutSummaryInput): CheckoutSummary {
  const subtotal = normalizeMoney(input.subtotal);
  const requestedDiscount = normalizeMoney(input.discountAmount);
  const discountAmount = Math.min(requestedDiscount, subtotal);
  const taxRate = Math.max(input.taxRate, 0);
  const deliveryFee = normalizeMoney(input.deliveryFee);
  const taxableAmount = Math.max(subtotal - discountAmount, 0);
  const taxAmount = normalizeMoney((taxableAmount * taxRate) / 100);
  const total = taxableAmount + taxAmount + deliveryFee;

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxRate,
    taxAmount,
    deliveryFee,
    total,
  };
}
