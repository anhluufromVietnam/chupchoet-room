import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// Runtime uploads live outside public/ — production Next.js only serves
// files that existed in public/ at build time, so they are served via
// /api/uploads/[name] instead.
const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads')
const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const files = form.getAll('files').filter((f): f is File => f instanceof File)
    if (files.length === 0) {
      return NextResponse.json({ error: 'Không có file nào được chọn' }, { status: 400 })
    }
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
    const urls: string[] = []
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Định dạng không hỗ trợ: ${file.name} (${file.type})` },
          { status: 400 }
        )
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: `${file.name} vượt quá 5MB` }, { status: 400 })
      }
      const rawExt = file.name.includes('.') ? file.name.split('.').pop()! : 'jpg'
      const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())
      await fs.writeFile(path.join(UPLOAD_DIR, name), buffer)
      urls.push(`/api/uploads/${name}`)
    }
    return NextResponse.json({ urls })
  } catch {
    return NextResponse.json({ error: 'Upload ảnh thất bại' }, { status: 500 })
  }
}
