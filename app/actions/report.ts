'use server'

import { generateMonthlyReport, emptyReport, MonthlyReport } from '@/lib/reports'

export async function getReport(year: number, month: number): Promise<MonthlyReport> {
  try {
    return await generateMonthlyReport(year, month)
  } catch (err) {
    console.error('[report] getReport failed:', err)
    return emptyReport(year, month)
  }
}
