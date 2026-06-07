/**
 * Extract VAT from a VAT-inclusive amount.
 * amount  = total amount (VAT included)
 * vatRate = e.g. 18 (not 0.18)
 */
export function extractVat(amount: number, vatRate: number): number {
  return (amount * vatRate) / (100 + vatRate)
}

/**
 * Amount excluding VAT.
 */
export function amountWithoutVat(amount: number, vatRate: number): number {
  return amount - extractVat(amount, vatRate)
}

/**
 * VAT for installment payments.
 * Rule: VAT is charged on the FULL total_amount, but only on installment #1.
 * All other installments: vat_amount = 0.
 */
export function installmentVat(
  totalAmount: number,
  installmentNumber: number,
  vatRate: number
): number {
  return installmentNumber === 1 ? extractVat(totalAmount, vatRate) : 0
}
