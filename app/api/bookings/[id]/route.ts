import { NextResponse } from 'next/server'
import { readDb, writeDb } from '@/lib/store'
import { BookingStatus } from '@/lib/data'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = (await req.json()) as { status?: BookingStatus }
    if (!body?.status) {
      return NextResponse.json({ error: 'Thiếu trạng thái' }, { status: 400 })
    }
    const db = await readDb()
    const booking = db.bookings.find((b) => b.id === id || b.code === id)
    if (!booking) return NextResponse.json({ error: 'Không tìm thấy đơn' }, { status: 404 })
    booking.status = body.status
    if (!booking.id) booking.id = id
    await writeDb(db)
    return NextResponse.json({ booking })
  } catch {
    return NextResponse.json({ error: 'Không thể cập nhật đơn' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await readDb()
  const before = db.bookings.length
  db.bookings = db.bookings.filter((b) => b.id !== id && b.code !== id)
  if (db.bookings.length === before) {
    return NextResponse.json({ error: 'Không tìm thấy đơn' }, { status: 404 })
  }
  await writeDb(db)
  return NextResponse.json({ ok: true })
}
