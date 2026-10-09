import { NextResponse } from 'next/server'

/** Validate the existing Firebase login on the server before deleting a booking. */
export async function requireBookingAdmin(req: Request): Promise<NextResponse | null> {
  const token = req.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1]
  if (!token) {
    return NextResponse.json({ error: 'Vui lòng đăng nhập quản trị để xoá đơn.' }, { status: 401 })
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAJxHhakZ4YXOGTYSw4j7VeCyEjtrtt7Bc'
  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) {
      return NextResponse.json({ error: 'Không thể xác thực phiên đăng nhập. Vui lòng đăng nhập lại.' }, { status: 401 })
    }
    const data = await response.json() as { users?: { localId?: string; email?: string; disabled?: boolean }[] }
    const user = data.users?.[0]
    const adminEmails = (process.env.ROOM_ADMIN_EMAILS ?? 'admin@gmail.com')
      .split(',').map((email) => email.trim().toLowerCase()).filter(Boolean)
    if (!user?.localId || user.disabled || !user.email || !adminEmails.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Tài khoản này không có quyền xoá đơn đặt phòng.' }, { status: 403 })
    }
    return null
  } catch {
    return NextResponse.json({ error: 'Chưa thể xác thực quản trị. Vui lòng thử lại.' }, { status: 503 })
  }
}
