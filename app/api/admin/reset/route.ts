import { NextResponse } from 'next/server'
import { resetDb } from '@/lib/store'

export async function POST() {
  const db = await resetDb()
  return NextResponse.json({ ok: true, rooms: db.rooms.length, bookings: db.bookings.length })
}
