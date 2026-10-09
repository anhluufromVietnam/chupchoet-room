import { Studio, BookingData, BookingStatus, PaymentSettings, normalizeStudio } from './data'
import { auth } from './firebase'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    cache: 'no-store',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Yêu cầu thất bại (${res.status})`)
  }
  return res.json()
}

export async function getRooms(): Promise<Studio[]> {
  const data = await request<{ rooms: Studio[] }>('/api/rooms')
  return data.rooms.map((room) => normalizeStudio(room))
}

export async function getRoomById(id: string): Promise<Studio | null> {
  try {
    const data = await request<{ room: Studio }>(`/api/rooms/${encodeURIComponent(id)}`)
    return normalizeStudio(data.room)
  } catch {
    return null
  }
}

export async function saveRoom(room: Studio): Promise<void> {
  await request<{ room: Studio }>(`/api/rooms/${encodeURIComponent(room.id)}`, {
    method: 'PUT',
    body: JSON.stringify(room),
  })
}

export async function deleteRoom(id: string): Promise<void> {
  await request<{ ok: boolean }>(`/api/rooms/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function createBooking(booking: Omit<BookingData, 'id'> & { id?: string }): Promise<void> {
  await request<{ booking: BookingData }>('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(booking),
  })
}

export async function getBookings(): Promise<BookingData[]> {
  const data = await request<{ bookings: BookingData[] }>('/api/bookings')
  return data.bookings
}

export async function searchBookings(term: string): Promise<BookingData[]> {
  const bookings = await getBookings()
  const q = term.trim().toLowerCase()
  if (!q) return bookings
  return bookings.filter((b) =>
    [b.code, b.customerName, b.customerPhone, b.instagramNickname, b.studioName]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(q))
  )
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
  await request<{ booking: BookingData }>(`/api/bookings/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function updateBooking(id: string, data: Partial<BookingData>): Promise<BookingData> {
  const result = await request<{ booking: BookingData }>(`/api/bookings/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return result.booking
}

export async function deleteBooking(id: string): Promise<void> {
  await auth.authStateReady()
  if (!auth.currentUser) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
  const token = await auth.currentUser.getIdToken()
  await request<{ ok: boolean }>(`/api/bookings/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function uploadImages(files: File[]): Promise<string[]> {
  const form = new FormData()
  files.forEach((file) => form.append('files', file))
  const res = await fetch('/api/upload', { method: 'POST', body: form })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Upload ảnh thất bại')
  }
  const data = (await res.json()) as { urls: string[] }
  return data.urls
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  return request<PaymentSettings>('/api/settings')
}

export async function savePaymentSettings(settings: PaymentSettings): Promise<PaymentSettings> {
  return request<PaymentSettings>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
}

export async function loginAdmin(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

export function logoutAdmin(): Promise<void> {
  return signOut(auth)
}

export function onAdminAuthStateChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}
