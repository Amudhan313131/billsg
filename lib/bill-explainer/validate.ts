import type { LineItem, ParsedBill } from '@/lib/bill-parser/types'

export function shouldExplainItem(item: LineItem, bill: ParsedBill): boolean {
  return (
    item.description.trim() !== '' &&
    Number.isFinite(item.amount) &&
    bill.ward_class !== 'unknown' &&
    bill.line_items.length >= 3
  )
}
