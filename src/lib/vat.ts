/**
 * Expense amounts (expenses.total_amount, expense_installments.amount,
 * expense_category_splits.amount) are stored EX-VAT.
 * Income (income.final_price) is stored VAT-inclusive.
 * vatRate = e.g. 18 (not 0.18)
 */

/**
 * VAT on an ex-VAT amount.
 */
export function vatOnExAmount(exAmount: number, vatRate: number): number {
  return (exAmount * vatRate) / 100
}

/**
 * VAT-inclusive total for an ex-VAT amount.
 */
export function amountWithVat(exAmount: number, vatRate: number): number {
  return exAmount * (1 + vatRate / 100)
}

/**
 * Extract VAT from a VAT-inclusive amount (used for income).
 */
export function extractVat(amount: number, vatRate: number): number {
  return (amount * vatRate) / (100 + vatRate)
}

/**
 * VAT for installment payments (a single purchase split into N payments).
 * Rule: VAT is charged on the FULL ex-VAT total, but only on installment #1.
 * All other installments: vat_amount = 0.
 * Recurring expenses are NOT installments — they get VAT every month via
 * vatOnExAmount directly (each month has its own invoice).
 */
export function installmentVat(
  totalExAmount: number,
  installmentNumber: number,
  vatRate: number
): number {
  return installmentNumber === 1 ? vatOnExAmount(totalExAmount, vatRate) : 0
}
