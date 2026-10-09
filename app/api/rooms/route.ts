import { NextResponse } from 'next/server'
import { readDb, writeDb } from '@/lib/store'
import { Studio } from '@/lib/data'

export async function GET() {
  const db = await readDb()
  return NextResponse.json({ rooms: db.rooms })
}

export async function POST(req: Request) {
  try {
    const room = (await req.json()) as Studio
    if (!room?.id || !room?.name) {
      return NextResponse.json({ error: 'Thiếu dữ liệu phòng' }, { status: 400 })
    }
    const db = await readDb()
    if (db.rooms.some((r) => r.id === room.id)) {
      return NextResponse.json({ error: 'Phòng đã tồn tại' }, { status: 409 })
    }
    db.rooms.unshift(room)
    await writeDb(db)
    return NextResponse.json({ room }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Không thể tạo phòng' }, { status: 500 })
  }
}
