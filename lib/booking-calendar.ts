import type { BookingData, BookingStatus } from './data'

const DAY_MS = 24 * 60 * 60 * 1000
export const STUDIO_TIME_ZONE = 'Asia/Ho_Chi_Minh'

export const bookingStatusLabels: Record<BookingStatus, string> = {
  chua_xac_nhan: 'Chưa xác nhận', pending: 'Chưa xác nhận',
  da_xac_nhan: 'Đã xác nhận', confirmed: 'Đã xác nhận', deposit_paid: 'Đã đặt cọc',
  dang_thue: 'Đang thuê', da_hoan_thanh: 'Đã hoàn thành', completed: 'Đã hoàn thành', cancelled: 'Đã huỷ',
}

export function studioDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: STUDIO_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date)
  const part = (type: string) => parts.find((item) => item.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function bookingTimestamp(value: string): number {
  // The booking form stores local studio times, sometimes with a one-digit hour.
  const local = value.match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/)
  if (local) return Date.parse(`${local[1]}T${(local[2] || '00').padStart(2, '0')}:${local[3] || '00'}:${local[4] || '00'}+07:00`)
  return Date.parse(value)
}

export function bookingEndTimestamp(booking: BookingData): number {
  const start = bookingTimestamp(booking.checkIn)
  let end = bookingTimestamp(booking.checkOut)
  // Older hourly orders wrap the hour at midnight but keep the arrival date.
  if (booking.rentalType === 'hourly' && end <= start) end += DAY_MS
  return end
}

export function bookingOccursOnDate(booking: BookingData, day: string): boolean {
  if (booking.status === 'cancelled') return false
  const start = bookingTimestamp(booking.checkIn)
  const end = bookingEndTimestamp(booking)
  const dayStart = bookingTimestamp(day)
  return Number.isFinite(start) && Number.isFinite(end) && end > start && start < dayStart + DAY_MS && end > dayStart
}

export function calendarMonthDays(month: string): (string | null)[] {
  const [year, monthNumber] = month.split('-').map(Number)
  const first = new Date(Date.UTC(year, monthNumber - 1, 1))
  const offset = (first.getUTCDay() + 6) % 7
  const count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  const cells: (string | null)[] = Array.from({ length: offset }, () => null)
  for (let day = 1; day <= count; day += 1) cells.push(`${month}-${String(day).padStart(2, '0')}`)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function shiftCalendarMonth(month: string, offset: number): string {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Date(Date.UTC(year, monthNumber - 1 + offset, 1)).toISOString().slice(0, 7)
}

export function formatBookingDateTime(value: string): string {
  const timestamp = bookingTimestamp(value)
  if (!Number.isFinite(timestamp)) return value || '—'
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: STUDIO_TIME_ZONE, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(timestamp)
}

export function shiftCalendarDay(dateKey: string, offsetDays: number): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + offsetDays))
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDayTitle(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const dayOfWeek = date.getUTCDay()
  const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  const dayName = dayNames[dayOfWeek]
  const dayStr = String(d).padStart(2, '0')
  const monthStr = String(m).padStart(2, '0')
  return `${dayName}, ${dayStr}/${monthStr}`
}

export function extractBookingHour(booking: BookingData): { hour: number; timeStr: string } {
  const match = booking.checkIn.match(/(?:[ T])(\d{1,2}):(\d{2})/)
  if (match) {
    const hour = parseInt(match[1], 10)
    const minute = match[2]
    return {
      hour,
      timeStr: `${String(hour).padStart(2, '0')}:${minute}`,
    }
  }
  const ts = bookingTimestamp(booking.checkIn)
  if (Number.isFinite(ts)) {
    const d = new Date(ts)
    const hourPart = new Intl.DateTimeFormat('en-US', {
      timeZone: STUDIO_TIME_ZONE,
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(d)
    const hour = parseInt(hourPart.find((p) => p.type === 'hour')?.value || '0', 10)
    const minute = hourPart.find((p) => p.type === 'minute')?.value || '00'
    return {
      hour,
      timeStr: `${String(hour).padStart(2, '0')}:${minute}`,
    }
  }
  return { hour: 0, timeStr: '00:00' }
}

