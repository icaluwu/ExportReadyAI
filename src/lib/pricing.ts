export const PAYMENT_TAX_RATE = 0.11;

export function calculatePaymentTotal(subtotal: number): {
  subtotal: number;
  tax: number;
  total: number;
} {
  const normalizedSubtotal = Math.max(0, Math.round(subtotal));
  const tax = Math.round(normalizedSubtotal * PAYMENT_TAX_RATE);
  return { subtotal: normalizedSubtotal, tax, total: normalizedSubtotal + tax };
}
