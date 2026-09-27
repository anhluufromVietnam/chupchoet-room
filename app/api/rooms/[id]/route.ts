import { NextResponse } from 'next/server'
import { readDb, writeDb } from '@/lib/store'
import { Studio } from '@/lib/data'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await readDb()
  const room = db.rooms.find((r) => r.id === id)
  if (!room) return NextResponse.json({ error: 'Không tìm thấy phòng' }, { status: 404 })
  return NextResponse.json({ room })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const room = (await req.json()) as Studio
    if (!room?.name) {
      return NextResponse.json({ error: 'Thiếu dữ liệu phòng' }, { status: 400 })
    }
    const db = await readDb()
    const idx = db.rooms.findIndex((r) => r.id === id)
    if (idx === -1) {
      db.rooms.unshift(room)
    } else {
      db.rooms[idx] = room
    }
    await writeDb(db)
    return NextResponse.json({ room })
  } catch {
    return NextResponse.json({ error: 'Không thể lưu phòng' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await readDb()
  const before = db.rooms.length
  db.rooms = db.rooms.filter((r) => r.id !== id)
  if (db.rooms.length === before) {
    return NextResponse.json({ error: 'Không tìm thấy phòng' }, { status: 404 })
  }
  await writeDb(db)
  return NextResponse.json({ ok: true })
}
