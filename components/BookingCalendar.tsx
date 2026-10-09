'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Calendar as CalendarIcon,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Laptop,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react'
import type { BookingData, Studio } from '@/lib/data'
import {
  STUDIO_TIME_ZONE,
  bookingOccursOnDate,
  calendarMonthDays,
  extractBookingHour,
  formatBookingDateTime,
  formatDayTitle,
  shiftCalendarDay,
  shiftCalendarMonth,
  studioDateKey,
} from '@/lib/booking-calendar'

interface BookingCalendarProps {
  bookings: BookingData[]
  rooms: Studio[]
  refreshing: boolean
  onRefresh: () => void
  onDelete: (booking: BookingData) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function BookingCalendar({
  bookings,
  rooms,
  refreshing,
  onRefresh,
  onDelete,
}: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(() => studioDateKey())
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day')
  const [month, setMonth] = useState(() => studioDateKey().slice(0, 7))
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null)
  const [roomId, setRoomId] = useState('')

  const timelineContainerRef = useRef<HTMLDivElement>(null)

  // Current Vietnam hour
  const currentVNHour = useMemo(() => {
    try {
      const part = new Intl.DateTimeFormat('en-US', {
        timeZone: STUDIO_TIME_ZONE,
        hour: 'numeric',
        hour12: false,
      }).format(new Date())
      return parseInt(part, 10)
    } catch {
      return new Date().getHours()
    }
  }, [])

  const isToday = selectedDate === studioDateKey()

  // Filter bookings by selected room if any
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => !roomId || b.studioId === roomId)
  }, [bookings, roomId])

  // Bookings occurring on selectedDate
  const dayBookings = useMemo(() => {
    return filteredBookings
      .filter((b) => bookingOccursOnDate(b, selectedDate))
      .sort((a, b) => {
        const hA = extractBookingHour(a).timeStr
        const hB = extractBookingHour(b).timeStr
        return hA.localeCompare(hB)
      })
  }, [filteredBookings, selectedDate])

  // Map of bookings grouped by start hour for the timeline
  const bookingsByHour = useMemo(() => {
    const map = new Map<number, BookingData[]>()
    for (let h = 0; h < 24; h++) map.set(h, [])

    dayBookings.forEach((b) => {
      const { hour } = extractBookingHour(b)
      const list = map.get(hour) || []
      list.push(b)
      map.set(hour, list)
    })
    return map
  }, [dayBookings])

  // Auto scroll timeline to current hour or first booking on date change
  useEffect(() => {
    if (viewMode !== 'day' || !timelineContainerRef.current) return
    const container = timelineContainerRef.current
    const targetHour = isToday
      ? currentVNHour
      : dayBookings.length > 0
        ? extractBookingHour(dayBookings[0]).hour
        : 8

    const row = container.querySelector(`[data-hour="${targetHour}"]`) as HTMLElement | null
    if (row) {
      const targetTop = row.offsetTop - container.offsetTop - 80
      container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
    }
  }, [selectedDate, viewMode, isToday, currentVNHour, dayBookings])

  const scrollTimeline = (amount: number) => {
    if (timelineContainerRef.current) {
      timelineContainerRef.current.scrollBy({ top: amount, behavior: 'smooth' })
    }
  }

  const changeDay = (offset: number) => {
    const nextDate = shiftCalendarDay(selectedDate, offset)
    setSelectedDate(nextDate)
    setMonth(nextDate.slice(0, 7))
  }

  const changeMonth = (offset: number) => {
    const nextMonth = shiftCalendarMonth(month, offset)
    setMonth(nextMonth)
    setSelectedDate(`${nextMonth}-01`)
  }

  const goToToday = () => {
    const today = studioDateKey()
    setSelectedDate(today)
    setMonth(today.slice(0, 7))
  }

  // Month grid data
  const days = useMemo(() => calendarMonthDays(month), [month])
  const bookingsByDay = useMemo(() => {
    return new Map(
      days
        .filter((day): day is string => Boolean(day))
        .map((day) => [day, filteredBookings.filter((b) => bookingOccursOnDate(b, day))])
    )
  }, [days, filteredBookings])

  const roomOptions = useMemo(() => {
    const options = new Map(rooms.map((room) => [room.id, room.name]))
    bookings.forEach((booking) => {
      if (!options.has(booking.studioId)) {
        options.set(booking.studioId, `${booking.studioName} (đã xoá)`)
      }
    })
    return [...options]
  }, [rooms, bookings])

  // Status mapping matching reference screenshot
  const getStatusMeta = (booking: BookingData) => {
    if (booking.status === 'dang_thue') {
      return {
        label: 'Đang sử dụng',
        borderClass: 'border-l-[6px] border-emerald-500',
        badgeBg: 'bg-emerald-500',
        statusColor: 'text-emerald-600',
      }
    }
    if (booking.status === 'chua_xac_nhan' || booking.status === 'pending') {
      return {
        label: 'Chưa xác nhận',
        borderClass: 'border-l-[6px] border-rose-500',
        badgeBg: 'bg-rose-500',
        statusColor: 'text-rose-600',
      }
    }
    // Confirmed / ready
    return {
      label: 'Sẵn sàng',
      borderClass: 'border-l-[6px] border-slate-300',
      badgeBg: 'bg-[#505c6e]',
      statusColor: 'text-slate-600',
    }
  }

  return (
    <section className="space-y-6">
      {/* =========================================================================
          TOP HEADER: Title "Thứ Tư, 07/10" & Segmented View Controls
         ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-sans text-3xl font-extrabold tracking-tight text-[#e11d48] sm:text-4xl">
            {formatDayTitle(selectedDate)}
          </h1>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3 py-1 shadow-xs">
            <Laptop size={13} className="text-slate-700" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
              GIAO DIỆN NGÀY
            </span>
          </div>
        </div>

        {/* Right Switcher Control */}
        <div className="flex items-center rounded-full border border-slate-200/90 bg-white p-1 shadow-xs">
          {/* Segmented: Tháng / Ngày */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`rounded-full px-3.5 py-1 text-xs font-bold transition ${
                viewMode === 'month'
                  ? 'bg-[#e11d48] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Tháng
            </button>
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`rounded-full px-4 py-1 text-xs font-bold transition ${
                viewMode === 'day'
                  ? 'bg-[#e11d48] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Ngày
            </button>
          </div>

          {/* Thin Divider */}
          <div className="mx-1 h-3.5 w-px bg-slate-200" />

          {/* Controls: < HÔM NAY > */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => (viewMode === 'day' ? changeDay(-1) : changeMonth(-1))}
              aria-label="Lùi lại"
              className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-800 transition hover:text-slate-900"
            >
              HÔM NAY
            </button>
            <button
              type="button"
              onClick={() => (viewMode === 'day' ? changeDay(1) : changeMonth(1))}
              aria-label="Tiến tới"
              className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          DAY VIEW: 2 COLUMNS (LIVE TIMELINE + DAILY EVENTS)
         ========================================================================= */}
      {viewMode === 'day' ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN: LIVE TIMELINE CARD */}
          <div className="relative rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-sm lg:col-span-7">
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#e11d48]" />
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 md:text-sm">
                  TRỤC THỜI GIAN LIVE
                </h2>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full border border-emerald-500 bg-white px-2.5 py-0.5 text-[11px] font-bold text-emerald-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </div>
            </div>

            {/* Scroll Navigation Controls on right edge */}
            <div className="absolute right-4 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollTimeline(-130)}
                aria-label="Cuộn lên"
                className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <ChevronUp size={16} />
              </button>
              <div className="h-20 w-1 rounded-full bg-slate-300" />
              <button
                type="button"
                onClick={() => scrollTimeline(130)}
                aria-label="Cuộn xuống"
                className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <ChevronDown size={16} />
              </button>
            </div>

            {/* Timeline Rows Container */}
            <div
              ref={timelineContainerRef}
              className="mt-2 max-h-[560px] overflow-y-auto pr-8 divide-y divide-slate-100"
              style={{ scrollBehavior: 'smooth' }}
            >
              {HOURS.map((hour) => {
                const hourFormatted = `${String(hour).padStart(2, '0')}:00`
                const isCurrentHourActive = isToday && hour === currentVNHour
                const hourBookings = bookingsByHour.get(hour) || []

                return (
                  <div
                    key={hour}
                    data-hour={hour}
                    className={`flex min-h-[64px] items-center gap-4 py-2 transition ${
                      isCurrentHourActive
                        ? 'rounded-xl bg-[#fff0f4] px-2 shadow-xs'
                        : 'px-1'
                    }`}
                  >
                    {/* Hour Label */}
                    <div className="w-12 shrink-0 text-center select-none">
                      <span
                        className={`text-xs font-semibold ${
                          isCurrentHourActive
                            ? 'font-bold text-[#e11d48]'
                            : 'text-slate-400'
                        }`}
                      >
                        {hourFormatted}
                      </span>
                      {isCurrentHourActive && (
                        <span className="mx-auto mt-0.5 block h-1.5 w-1.5 rounded-full bg-[#e11d48]" />
                      )}
                    </div>

                    {/* Bookings Pills Area */}
                    <div className="flex flex-1 flex-wrap items-center gap-2.5">
                      {hourBookings.map((booking, idx) => (
                        <button
                          key={`${booking.id || booking.code}-${idx}`}
                          type="button"
                          onClick={() => setSelectedBooking(booking)}
                          className="flex items-center gap-2 rounded-full bg-[#485366] px-4 py-2 text-xs font-medium text-white shadow-md shadow-slate-900/10 transition hover:bg-[#3d4655] focus:outline-hidden"
                          title="Bấm để xem chi tiết"
                        >
                          <Camera size={13} className="shrink-0 text-slate-300" />
                          <span className="whitespace-nowrap">
                            {booking.studioName} - {booking.customerName}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: SỰ KIỆN TRONG NGÀY */}
          <div className="lg:col-span-5">
            <h2 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-400">
              SỰ KIỆN TRONG NGÀY
            </h2>

            {dayBookings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-xs">
                <p className="text-sm text-slate-400">
                  Chưa có lịch đặt phòng trong ngày này.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
                {dayBookings.map((booking, idx) => {
                  const meta = getStatusMeta(booking)
                  const { timeStr } = extractBookingHour(booking)

                  return (
                    <article
                      key={`${booking.id || booking.code}-${idx}`}
                      onClick={() => setSelectedBooking(booking)}
                      className={`group relative cursor-pointer rounded-2xl bg-white p-4 shadow-[0_4px_18px_rgba(0,0,0,0.03)] border border-slate-100 transition hover:shadow-md ${meta.borderClass}`}
                    >
                      {/* Top Row: Badge & Time */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest text-white shadow-xs ${meta.badgeBg}`}
                        >
                          •••
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {timeStr}
                        </span>
                      </div>

                      {/* Middle Row: Customer Name & Equipment */}
                      <div className="mt-2.5">
                        <h3 className="text-sm font-bold text-slate-900">
                          {booking.customerName}
                        </h3>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Camera size={13} className="text-sky-500" />
                          <span>{booking.studioName}</span>
                        </div>
                      </div>

                      {/* Bottom Row: Customer Phone & Status */}
                      <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-2 text-xs">
                        <span className="text-[11px] text-slate-400">
                          {booking.customerPhone || '—'}
                        </span>
                        <span className={`font-bold ${meta.statusColor}`}>
                          {meta.label}
                        </span>
                      </div>

                      {/* Quick Delete button on hover */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(booking)
                        }}
                        title="Xoá đơn đặt phòng"
                        className="absolute right-12 top-3 opacity-0 transition group-hover:opacity-100 rounded-lg p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* =========================================================================
            MONTH VIEW: MONTH GRID OVERVIEW
           ========================================================================= */
        <div className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50"
              >
                <ChevronLeft size={18} />
              </button>
              <h2 className="min-w-36 text-center font-bold text-slate-900">
                Tháng {Number(month.slice(5))}/{month.slice(0, 4)}
              </h2>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                Phòng:
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs"
                >
                  <option value="">Tất cả phòng</option>
                  {roomOptions.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                Làm mới
              </button>
            </div>
          </div>

          {/* Days Grid */}
          <div className="mt-4 grid grid-cols-7 gap-1 sm:gap-2">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((label) => (
              <div
                key={label}
                className="py-2 text-center text-xs font-bold text-slate-400 select-none"
              >
                {label}
              </div>
            ))}
            {days.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} aria-hidden="true" />
              const dayItems = bookingsByDay.get(day) ?? []
              const selected = day === selectedDate
              const isTodayCell = day === studioDateKey()

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    setSelectedDate(day)
                    setViewMode('day')
                  }}
                  className={`min-h-20 min-w-0 rounded-2xl border p-2 text-left transition sm:min-h-24 sm:p-3 ${
                    selected
                      ? 'border-[#e11d48] bg-rose-50/50 ring-1 ring-[#e11d48]'
                      : 'border-slate-100 hover:bg-slate-50/70'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      isTodayCell
                        ? 'bg-[#e11d48] text-white'
                        : 'text-slate-800'
                    }`}
                  >
                    {Number(day.slice(-2))}
                  </span>
                  {dayItems.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      <span className="block text-[10px] font-bold text-[#e11d48]">
                        {dayItems.length} đơn
                      </span>
                      <span className="hidden truncate text-[11px] text-slate-500 sm:block">
                        {dayItems[0].studioName}
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          BOOKING DETAIL MODAL
         ========================================================================= */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedBooking(null)}
              className="absolute right-5 top-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-[#e11d48]">
                <CalendarIcon size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedBooking.studioName}
                </h3>
                <p className="font-mono text-xs text-slate-400">
                  Mã đơn: {selectedBooking.code}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Khách hàng:</span>
                <span className="font-bold text-slate-900">
                  {selectedBooking.customerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số điện thoại:</span>
                <span className="font-bold text-slate-900">
                  {selectedBooking.customerPhone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Giờ thuê:</span>
                <span className="font-bold text-slate-900">
                  {formatBookingDateTime(selectedBooking.checkIn)} →{' '}
                  {formatBookingDateTime(selectedBooking.checkOut)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số lượng khách:</span>
                <span className="font-bold text-slate-900">
                  {selectedBooking.guests} người
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái:</span>
                <span className="font-bold text-slate-900">
                  {getStatusMeta(selectedBooking).label}
                </span>
              </div>
              {selectedBooking.totalPrice > 0 && (
                <div className="flex justify-between border-t border-slate-200/60 pt-2 font-bold">
                  <span className="text-slate-700">Tổng tiền:</span>
                  <span className="text-[#e11d48]">
                    {selectedBooking.totalPrice.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  const b = selectedBooking
                  setSelectedBooking(null)
                  onDelete(b)
                }}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
              >
                <Trash2 size={14} /> Xoá đơn
              </button>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
