import { NextResponse } from 'next/server'
import { readDb, writeDb } from '@/lib/store'
import { defaultPaymentSettings, PaymentSettings } from '@/lib/data'

export async function GET() {
  const db = await readDb()
  return NextResponse.json(db.settings.payment)
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<PaymentSettings>
    const db = await readDb()
    const merged: PaymentSettings = {
      ...defaultPaymentSettings,
      ...db.settings.payment,
      ...body,
    }
    db.settings.payment = merged
    await writeDb(db)
    return NextResponse.json(merged)
  } catch (error) {
    console.error('Failed to save settings:', error)
    return NextResponse.json({ error: 'Không lưu được cài đặt thanh toán' }, { status: 500 })
  }
}
