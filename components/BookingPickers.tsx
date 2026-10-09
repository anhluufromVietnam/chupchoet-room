'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Timer,
} from 'lucide-react'

// Helper to format date YYYY-MM-DD to Vietnamese display
function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return 'Chọn ngày'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function formatDayOfWeek(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  return days[date.getUTCDay()]
}

function getTimePeriod(timeStr: string): string {
  const hour = parseInt(timeStr.split(':')[0], 10)
  if (hour < 12) return 'Buổi sáng'
  if (hour < 18) return 'Buổi chiều'
  return 'Buổi tối'
}

/* =========================================================================
   1. COQUETTE DATE PICKER POPUP (BẢNG LỊCH)
   ========================================================================= */
interface CoquetteDatePickerProps {
  label: string
  value: string
  minDate?: string
  onChange: (value: string) => void
}

export function CoquetteDatePicker({
  label,
  value,
  minDate,
  onChange,
}: CoquetteDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calendar view month (YYYY-MM)
  const [viewMonth, setViewMonth] = useState(() => {
    return value ? value.slice(0, 7) : new Date().toISOString().slice(0, 7)
  })

  // Synchronize viewMonth when value changes
  useEffect(() => {
    if (value) {
      setViewMonth(value.slice(0, 7))
    }
  }, [value])

  // Close popup on click outside
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Month navigation
  const [year, monthNum] = viewMonth.split('-').map(Number)
  const changeMonth = (delta: number) => {
    const d = new Date(Date.UTC(year, monthNum - 1 + delta, 1))
    const nextY = d.getUTCFullYear()
    const nextM = String(d.getUTCMonth() + 1).padStart(2, '0')
    setViewMonth(`${nextY}-${nextM}`)
  }

  const todayStr = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }, [])

  const goToToday = () => {
    setViewMonth(todayStr.slice(0, 7))
    onChange(todayStr)
    setIsOpen(false)
  }

  // Days in month calculation (Monday-first)
  const calendarCells = useMemo(() => {
    const firstDay = new Date(Date.UTC(year, monthNum - 1, 1))
    const offset = (firstDay.getUTCDay() + 6) % 7 // Monday = 0
    const totalDays = new Date(Date.UTC(year, monthNum, 0)).getUTCDate()

    const cells: (string | null)[] = Array.from({ length: offset }, () => null)
    for (let day = 1; day <= totalDays; day++) {
      const dayStr = String(day).padStart(2, '0')
      const mStr = String(monthNum).padStart(2, '0')
      cells.push(`${year}-${mStr}-${dayStr}`)
    }
    while (cells.length % 7 !== 0) {
      cells.push(null)
    }
    return cells
  }, [year, monthNum])

  return (
    <div ref={containerRef} className="field relative">
      <span className="field-label">{label}</span>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex w-full items-center justify-between gap-3 rounded-2xl border bg-white px-3.5 py-2.5 text-left transition-all ${
          isOpen
            ? 'border-[#ff4d94] shadow-[0_4px_16px_rgba(255,77,148,0.15)] ring-3 ring-[#ff4d94]/20'
            : 'border-pink-200/70 hover:border-[#ff4d94]/60 hover:shadow-[0_4px_14px_rgba(255,77,148,0.1)]'
        }`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-pink-50 to-rose-100/70 text-[#ff4d94]">
            <CalendarDays size={16} />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold leading-tight text-[#59263c]">
              {formatDisplayDate(value)}
            </div>
            <div className="text-[10px] font-medium text-[#8a5a6e]">
              {formatDayOfWeek(value) || 'Chạm để chọn'}
            </div>
          </div>
        </div>
        <ChevronDown
          size={14}
          className={`shrink-0 text-[#8a5a6e] transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#ff4d94]' : 'group-hover:text-[#ff4d94]'
          }`}
        />
      </button>

      {/* Floating Soft Calendar Popup */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[310px] max-w-[92vw] rounded-[28px] border border-pink-200/90 bg-white/98 p-4 shadow-[0_22px_50px_rgba(214,51,108,0.2),0_4px_14px_rgba(255,77,148,0.12)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-pink-100/80 pb-3">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#8a5a6e] transition hover:bg-pink-50 hover:text-[#d6336c]"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-serif text-sm font-bold text-[#59263c]">
                Tháng {monthNum}/{year}
              </span>
              <button
                type="button"
                onClick={goToToday}
                className="rounded-full border border-pink-200/60 bg-pink-50 px-2 py-0.5 text-[10px] font-bold text-[#d6336c] transition hover:bg-pink-100"
              >
                Hôm nay
              </button>
            </div>

            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#8a5a6e] transition hover:bg-pink-50 hover:text-[#d6336c]"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Row */}
          <div className="mt-3 grid grid-cols-7 gap-1 text-center">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
              <span key={d} className="text-[11px] font-bold text-[#8a5a6e]">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="mt-1.5 grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              if (!cell) return <div key={`empty-${idx}`} />
              const isSelected = cell === value
              const isToday = cell === todayStr
              const isDisabled = minDate ? cell < minDate : false

              return (
                <button
                  key={cell}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    onChange(cell)
                    setIsOpen(false)
                  }}
                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-xl text-xs font-semibold transition-all ${
                    isDisabled
                      ? 'cursor-not-allowed opacity-25 text-[#8a5a6e]'
                      : isSelected
                        ? 'bg-gradient-to-tr from-[#ff4d94] to-[#d6336c] text-white font-bold shadow-md shadow-pink-500/30 scale-105'
                        : isToday
                          ? 'border border-[#ff4d94] text-[#d6336c] font-bold hover:bg-pink-50'
                          : 'text-[#59263c] hover:bg-pink-50 hover:text-[#d6336c] hover:scale-105'
                  }`}
                >
                  {Number(cell.slice(-2))}
                </button>
              )
            })}
          </div>

          {/* Footer Note */}
          <div className="mt-3.5 flex items-center justify-center gap-1.5 border-t border-pink-100/80 pt-2.5 text-[11px] text-[#8a5a6e]">
            <Sparkles size={12} className="text-[#ff4d94]" />
            <span>Phòng mở cửa 07:00 – 22:00 hàng ngày</span>
          </div>
        </div>
      )}
    </div>
  )
}

/* =========================================================================
   2. COQUETTE TIME PICKER POPUP (BẢNG CHỌN GIỜ)
   ========================================================================= */
interface CoquetteTimePickerProps {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}

export function CoquetteTimePicker({
  label,
  value,
  options,
  onChange,
}: CoquetteTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Group options into Morning, Afternoon, Evening
  const { morning, afternoon, evening } = useMemo(() => {
    const m: string[] = []
    const a: string[] = []
    const e: string[] = []

    options.forEach((t) => {
      const h = parseInt(t.split(':')[0], 10)
      if (h < 12) m.push(t)
      else if (h < 18) a.push(t)
      else e.push(t)
    })
    return { morning: m, afternoon: a, evening: e }
  }, [options])

  const renderSlot = (time: string) => {
    const isSelected =
      time === value ||
      (time.startsWith('0') && time.slice(1) === value) ||
      `0${time}` === value

    return (
      <button
        key={time}
        type="button"
        onClick={() => {
          onChange(time)
          setIsOpen(false)
        }}
        className={`rounded-xl py-2 px-1 text-center text-xs font-semibold transition-all ${
          isSelected
            ? 'bg-gradient-to-r from-[#ff4d94] to-[#d6336c] text-white font-bold shadow-sm shadow-pink-500/25 scale-[1.03]'
            : 'border border-pink-100 bg-white/90 text-[#59263c] hover:border-pink-300 hover:bg-pink-50/80 hover:text-[#d6336c]'
        }`}
      >
        {time}
      </button>
    )
  }

  return (
    <div ref={containerRef} className="field relative">
      <span className="field-label">{label}</span>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex w-full items-center justify-between gap-3 rounded-2xl border bg-white px-3.5 py-2.5 text-left transition-all ${
          isOpen
            ? 'border-[#ff4d94] shadow-[0_4px_16px_rgba(255,77,148,0.15)] ring-3 ring-[#ff4d94]/20'
            : 'border-pink-200/70 hover:border-[#ff4d94]/60 hover:shadow-[0_4px_14px_rgba(255,77,148,0.1)]'
        }`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-pink-50 to-rose-100/70 text-[#ff4d94]">
            <Clock size={16} />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold leading-tight text-[#59263c]">
              {value}
            </div>
            <div className="text-[10px] font-medium text-[#8a5a6e]">
              {getTimePeriod(value)}
            </div>
          </div>
        </div>
        <ChevronDown
          size={14}
          className={`shrink-0 text-[#8a5a6e] transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#ff4d94]' : 'group-hover:text-[#ff4d94]'
          }`}
        />
      </button>

      {/* Floating Soft Time Picker Popup */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[290px] max-w-[92vw] rounded-[28px] border border-pink-200/90 bg-white/98 p-4 shadow-[0_22px_50px_rgba(214,51,108,0.2),0_4px_14px_rgba(255,77,148,0.12)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-pink-100/80 pb-2.5">
            <div className="flex items-center gap-1.5">
              <Clock size={15} className="text-[#ff4d94]" />
              <span className="font-serif text-sm font-bold text-[#59263c]">
                Chọn giờ bắt đầu
              </span>
            </div>
            <span className="rounded-full border border-pink-100 bg-pink-50 px-2 py-0.5 text-[10px] font-medium text-[#8a5a6e]">
              Ca 1 giờ
            </span>
          </div>

          <div className="mt-3 max-h-[260px] space-y-3 overflow-y-auto pr-1">
            {morning.length > 0 && (
              <div>
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8a5a6e]">
                  Buổi sáng (07:00 – 11:00)
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {morning.map(renderSlot)}
                </div>
              </div>
            )}

            {afternoon.length > 0 && (
              <div>
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8a5a6e]">
                  Buổi chiều (12:00 – 17:00)
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {afternoon.map(renderSlot)}
                </div>
              </div>
            )}

            {evening.length > 0 && (
              <div>
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8a5a6e]">
                  Buổi tối (18:00 – 22:00)
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {evening.map(renderSlot)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* =========================================================================
   3. COQUETTE HOURS INPUT (SỐ LƯỢNG GIỜ THUÊ DẠNG NHẬP)
   ========================================================================= */
interface CoquetteHoursInputProps {
  label: string
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
}

export function CoquetteHoursInput({
  label,
  value,
  min = 1,
  max = 24,
  onChange,
}: CoquetteHoursInputProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '') {
      onChange(min)
      return
    }
    const val = parseInt(raw, 10)
    if (!isNaN(val)) {
      onChange(Math.max(min, Math.min(max, val)))
    }
  }

  const handleStep = (delta: number) => {
    onChange(Math.max(min, Math.min(max, value + delta)))
  }

  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="flex w-full items-center justify-between gap-2 rounded-2xl border border-pink-200/70 bg-white px-3.5 py-2 transition-all focus-within:border-[#ff4d94] focus-within:ring-3 focus-within:ring-[#ff4d94]/20 hover:border-[#ff4d94]/60 hover:shadow-[0_4px_14px_rgba(255,77,148,0.1)]">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-pink-50 to-rose-100/70 text-[#ff4d94]">
            <Timer size={16} />
          </div>
          <div className="flex flex-1 items-center gap-1.5">
            <input
              type="number"
              min={min}
              max={max}
              value={value || ''}
              onChange={handleInputChange}
              className="w-16 border-none bg-transparent p-0 text-sm font-bold text-[#59263c] outline-none focus:ring-0"
              placeholder="1"
            />
            <span className="text-xs font-semibold text-[#8a5a6e]">giờ</span>
          </div>
        </div>

        {/* Quick Stepper Buttons */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => handleStep(-1)}
            disabled={value <= min}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-pink-200/80 bg-pink-50 text-sm font-bold text-[#d6336c] transition hover:bg-pink-100 disabled:pointer-events-none disabled:opacity-40"
            aria-label="Giảm 1 giờ"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => handleStep(1)}
            disabled={value >= max}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-pink-200/80 bg-pink-50 text-sm font-bold text-[#d6336c] transition hover:bg-pink-100 disabled:pointer-events-none disabled:opacity-40"
            aria-label="Tăng 1 giờ"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}

