import { NextResponse } from 'next/server'
import { readDb, writeDb } from '@/lib/store'
import { BookingData } from '@/lib/data'

export async function GET() {
  const db = await readDb()
  const bookings = [...db.bookings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  return NextResponse.json({ bookings })
}

export async function POST(req: Request) {
  try {
    const booking = (await req.json()) as BookingData
    if (!booking?.code || !booking?.studioId) {
      return NextResponse.json({ error: 'Thiếu dữ liệu đơn đặt' }, { status: 400 })
    }
    if (!booking.id) {
      booking.id = `bk_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
    }
    const db = await readDb()
    db.bookings.unshift(booking)
    await writeDb(db)
    return NextResponse.json({ booking }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Không thể tạo đơn đặt' }, { status: 500 })
  }
}
