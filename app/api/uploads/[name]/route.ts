import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads')
const LEGACY_DIR = path.join(process.cwd(), 'public', 'uploads')

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  if (!/^[a-zA-Z0-9._-]+$/.test(name) || name.includes('..')) {
    return NextResponse.json({ error: 'Tên file không hợp lệ' }, { status: 400 })
  }
  const ext = name.split('.').pop()?.toLowerCase() || ''
  const contentType = MIME_TYPES[ext] || 'application/octet-stream'
  for (const dir of [UPLOAD_DIR, LEGACY_DIR]) {
    try {
      const buffer = await fs.readFile(path.join(dir, name))
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    } catch {
      // try next location
    }
  }
  return NextResponse.json({ error: 'Không tìm thấy ảnh' }, { status: 404 })
}
