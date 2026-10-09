import { NextResponse } from 'next/server'
import { readDb, writeDb } from '@/lib/store'
import { BookingStatus } from '@/lib/data'
import { requireBookingAdmin } from '@/lib/admin-auth'

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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const db = await readDb()
    const index = db.bookings.findIndex((b) => b.id === id || b.code === id)
    if (index < 0) return NextResponse.json({ error: 'Không tìm thấy đơn' }, { status: 404 })
    db.bookings[index] = { ...db.bookings[index], ...body, id: db.bookings[index].id || id }
    await writeDb(db)
    return NextResponse.json({ booking: db.bookings[index] })
  } catch {
    return NextResponse.json({ error: 'Không thể cập nhật đơn' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireBookingAdmin(req)
  if (authError) return authError
  try {
    const { id } = await params
    const db = await readDb()
    // Prefer the unique ID; booking codes support older records without an ID.
    const index = db.bookings.findIndex((b) => b.id === id)
    const bookingIndex = index >= 0 ? index : db.bookings.findIndex((b) => !b.id && b.code === id)
    if (bookingIndex < 0) {
      return NextResponse.json({ error: 'Không tìm thấy đơn' }, { status: 404 })
    }
    db.bookings.splice(bookingIndex, 1)
    await writeDb(db)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Không thể xoá đơn. Vui lòng thử lại.' }, { status: 500 })
  }
}
