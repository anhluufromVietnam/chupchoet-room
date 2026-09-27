'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  AtSign,
  MapPin,
  Phone,
  Sparkles,
  Star,
  Users,
} from 'lucide-react'
import { Studio, formatCurrency } from '@/lib/data'
import { getRooms, createBooking } from '@/lib/services'

const INSTAGRAM_NICK = 'chupchoet.room'
const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_NICK}`
const INSTAGRAM_APP_URL = `instagram://user?username=${INSTAGRAM_NICK}`

const STEPS = ['Chọn studio', 'Chọn thời gian', 'Thông tin khách', 'Xác nhận'] as const

const TIME_OPTIONS = Array.from({ length: 16 }, (_, i) => {
  const hour = 7 + i
  return `${hour}:00`
})

const DEPOSIT_OPTIONS = [
  { value: 'deposit', label: 'Đặt cọc 30% trước, phần còn lại thanh toán khi đến' },
  { value: 'full', label: 'Thanh toán 100% ngay để giữ chỗ' },
]

function generateBookingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return `CHUP-${code}`
}

function toDateInputValue(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + days)
  return toDateInputValue(d)
}

function formatDateVN(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
}

function addHoursToTime(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + hours * 60
  const nh = Math.floor(total / 60) % 24
  const nm = total % 60
  return `${nh}:${String(nm).padStart(2, '0')}`
}

function BookingWizard() {
  const searchParams = useSearchParams()
  const prefillStudioId = searchParams.get('studioId')

  const [step, setStep] = useState(0)
  const [studios, setStudios] = useState<Studio[]>([])
  const [loadingStudios, setLoadingStudios] = useState(true)

  // Step 1 — studio
  const [studioId, setStudioId] = useState('')
  // Step 2 — time
  const [rentalType, setRentalType] = useState<'hourly' | 'daily'>('hourly')
  const [checkInDate, setCheckInDate] = useState(toDateInputValue(new Date()))
  const [checkOutDate, setCheckOutDate] = useState(addDays(toDateInputValue(new Date()), 1))
  const [startTime, setStartTime] = useState('9:00')
  const [hoursCount, setHoursCount] = useState(2)
  const [daysCount, setDaysCount] = useState(1)
  const [guests, setGuests] = useState(2)
  // Step 3 — customer
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [instagramNickname, setInstagramNickname] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [depositChoice, setDepositChoice] = useState<'deposit' | 'full'>('deposit')
  // Submit
  const [submitting, setSubmitting] = useState(false)
  const [bookingCode, setBookingCode] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getRooms()
      .then((list) => {
        if (!active) return
        setStudios(list)
        if (prefillStudioId && list.some((s) => s.id === prefillStudioId)) {
          setStudioId(prefillStudioId)
        }
      })
      .finally(() => {
        if (active) setLoadingStudios(false)
      })
    return () => {
      active = false
    }
  }, [prefillStudioId])

  const selectedStudio = useMemo(
    () => studios.find((s) => s.id === studioId) ?? null,
    [studios, studioId],
  )

  const nights = rentalType === 'daily' ? Math.max(1, daysCount) : 0
  const hours = rentalType === 'hourly' ? Math.max(1, hoursCount) : 0

  const totalPrice = useMemo(() => {
    if (!selectedStudio) return 0
    if (rentalType === 'hourly') return selectedStudio.pricePerHour * hours
    return selectedStudio.pricePerDay * nights
  }, [selectedStudio, rentalType, hours, nights])

  const depositPrice = depositChoice === 'full' ? totalPrice : Math.round(totalPrice * 0.3)

  const paymentNote = `CHUPCHOET ${customerPhone || 'SODT'}`

  // Normalized phone: keep digits only, convert +84 prefix to 0
  const normalizedPhone = (() => {
    let digits = customerPhone.replace(/\D/g, '')
    if (digits.startsWith('84') && digits.length >= 10) digits = `0${digits.slice(2)}`
    return digits
  })()

  const step2Errors: string[] = []
  if (customerName.trim().length < 2) step2Errors.push('Chưa điền Họ và tên (tối thiểu 2 ký tự)')
  if (!/^[0-9]{9,11}$/.test(normalizedPhone))
    step2Errors.push('Số điện thoại chưa đúng — cần 9–11 số (VD: 0912345678)')
  if (instagramNickname.trim().length < 3)
    step2Errors.push('Chưa điền Nick Instagram (tối thiểu 3 ký tự, không cần dấu @)')
  const qrUrl = useMemo(() => {
    if (!selectedStudio || totalPrice <= 0) return null
    const params = new URLSearchParams({
      amount: String(depositPrice),
      addInfo: paymentNote,
      accountName: 'CHUPCHOET ROOM STUDIO',
    })
    return `https://img.vietqr.io/image/MB-0369399740-compact2.png?${params.toString()}`
  }, [selectedStudio, depositPrice, paymentNote])

  const stepValid = (index: number): boolean => {
    if (index === 0) return Boolean(selectedStudio)
    if (index === 1) {
      if (rentalType === 'hourly') return Boolean(checkInDate) && hoursCount > 0
      return Boolean(checkInDate) && Boolean(checkOutDate) && checkOutDate > checkInDate
    }
    if (index === 2) {
      return step2Errors.length === 0
    }
    return true
  }

  const canGoNext = stepValid(step)

  const handleStepClick = (target: number) => {
    if (target === step) return
    if (target < step) {
      setStep(target)
      return
    }
    for (let i = step; i < target; i += 1) {
      if (!stepValid(i)) return
    }
    setStep(target)
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text.replace(/\s/g, '')).catch(() => {})
    setCopied(key)
    setTimeout(() => setCopied(null), 1600)
  }

  const handleSubmit = async () => {
    if (!selectedStudio || submitting) return
    setSubmitting(true)
    const code = generateBookingCode()
    const checkIn =
      rentalType === 'hourly' ? `${checkInDate} ${startTime}` : `${checkInDate} 14:00`
    const checkOut =
      rentalType === 'hourly'
        ? `${checkInDate} ${addHoursToTime(startTime, hours)}`
        : `${checkOutDate} 12:00`

    try {
      await createBooking({
        code,
        studioId: selectedStudio.id,
        studioName: selectedStudio.name,
        studioImage: selectedStudio.images[0],
        studioAddress: `${selectedStudio.address}, ${selectedStudio.city}`,
        customerName: customerName.trim(),
        customerPhone: normalizedPhone,
        instagramNickname: instagramNickname.trim().replace(/^@/, ''),
        specialRequests: specialRequests.trim(),
        rentalType,
        hoursCount: rentalType === 'hourly' ? hours : undefined,
        checkIn,
        checkOut,
        nights,
        guests,
        totalPrice,
        depositPrice,
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
      setBookingCode(code)
      // Mirror reference flow: open Instagram app for confirmation, web fallback
      setTimeout(() => {
        window.location.href = INSTAGRAM_APP_URL
        setTimeout(() => {
          window.location.href = INSTAGRAM_URL
        }, 600)
      }, 1200)
    } catch (error) {
      console.error(error)
      alert('Không thể gửi đặt phòng. Vui lòng thử lại hoặc nhắn trực tiếp qua Instagram.')
    } finally {
      setSubmitting(false)
    }
  }

  if (bookingCode) {
    return (
      <main className="booking-shell">
        <div className="panel success-panel">
          <div className="success-icon">
            <CheckCircle2 size={56} strokeWidth={1.6} />
          </div>
          <h1 className="success-title">Đã gửi yêu cầu đặt phòng!</h1>
          <p className="success-code">
            Mã đặt phòng: <strong>{bookingCode}</strong>
          </p>
          <div className="notice-alert">
            <strong>QUAN TRỌNG:</strong> Nhớ vào Instagram của shop{' '}
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
              @{INSTAGRAM_NICK}
            </a>{' '}
            để nhắn tin xác nhận đơn và chốt lịch nhé!
          </div>
          <div className="success-actions">
            <a className="primary-button" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
              <AtSign size={18} /> Nhắn tin xác nhận qua Instagram
            </a>
            <Link className="ghost-button" href={`/booking/success/${bookingCode}`}>
              Xem vé đặt phòng
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="booking-shell">
      <header className="booking-head">
        <span className="brand-pill">
          <Sparkles size={14} /> chupchoet.room
        </span>
        <h1>Đặt lịch studio</h1>
        <p>Vài bước ngắn để giữ chỗ — shop sẽ xác nhận qua Instagram của bạn.</p>
      </header>

      <nav className="progress-steps" aria-label="Các bước đặt phòng">
        {STEPS.map((label, index) => {
          const state = index < step ? 'done' : index === step ? 'active' : 'todo'
          const reachable = index <= step || stepValid(index - 1)
          return (
            <button
              key={label}
              type="button"
              className={`progress-step ${state}`}
              disabled={!reachable}
              onClick={() => handleStepClick(index)}
            >
              <span className="progress-dot">{index < step ? '✓' : index + 1}</span>
              <span className="progress-label">{label}</span>
            </button>
          )
        })}
      </nav>

      <section className="panel booking-panel">
        {step === 0 && (
          <div className="step-body">
            <h2>1. Chọn studio của bạn</h2>
            {loadingStudios ? (
              <p className="muted">Đang tải danh sách studio…</p>
            ) : studios.length === 0 ? (
              <p className="muted">Chưa có studio nào. Vui lòng quay lại sau.</p>
            ) : (
              <div className="studio-grid">
                {studios.map((s) => {
                  const active = s.id === studioId
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`studio-card ${active ? 'selected' : ''}`}
                      onClick={() => setStudioId(s.id)}
                    >
                      <div className="studio-card-photo">
                        <img src={s.images[0]} alt={s.name} />
                        {active && (
                          <span className="studio-card-check">
                            <CheckCircle2 size={18} />
                          </span>
                        )}
                      </div>
                      <div className="studio-card-body">
                        <strong>{s.name}</strong>
                        <p className="muted">
                          <MapPin size={13} /> {s.address}, {s.city}
                        </p>
                        <p className="muted">
                          <Star size={13} /> {s.rating} · {s.reviewCount} đánh giá ·{' '}
                          <Users size={13} /> tối đa {s.guests} khách
                        </p>
                        <div className="studio-card-price">
                          <span>{formatCurrency(s.pricePerHour)}/giờ</span>
                          <span>{formatCurrency(s.pricePerDay)}/ngày</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="step-body">
            <h2>2. Chọn thời gian thuê</h2>
            <div className="mode-toggle">
              <button
                type="button"
                className={rentalType === 'hourly' ? 'active' : ''}
                onClick={() => setRentalType('hourly')}
              >
                <Clock size={16} /> Theo giờ
              </button>
              <button
                type="button"
                className={rentalType === 'daily' ? 'active' : ''}
                onClick={() => setRentalType('daily')}
              >
                <CalendarDays size={16} /> Theo ngày
              </button>
            </div>

            {rentalType === 'hourly' ? (
              <div className="field-row">
                <label className="field">
                  <span className="field-label">Ngày chụp</span>
                  <input
                    type="date"
                    className="input-coquette"
                    value={checkInDate}
                    min={toDateInputValue(new Date())}
                    onChange={(e) => setCheckInDate(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field-label">Giờ bắt đầu</span>
                  <select
                    className="input-coquette"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">Số giờ thuê</span>
                  <select
                    className="input-coquette"
                    value={hoursCount}
                    onChange={(e) => setHoursCount(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                      <option key={h} value={h}>
                        {h} giờ
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : (
              <div className="field-row">
                <label className="field">
                  <span className="field-label">Ngày nhận studio</span>
                  <input
                    type="date"
                    className="input-coquette"
                    value={checkInDate}
                    min={toDateInputValue(new Date())}
                    onChange={(e) => {
                      setCheckInDate(e.target.value)
                      if (checkOutDate <= e.target.value) setCheckOutDate(addDays(e.target.value, 1))
                    }}
                  />
                </label>
                <label className="field">
                  <span className="field-label">Ngày trả studio</span>
                  <input
                    type="date"
                    className="input-coquette"
                    value={checkOutDate}
                    min={addDays(checkInDate, 1)}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                  />
                </label>
              </div>
            )}

            <label className="field">
              <span className="field-label">Số khách</span>
              <input
                type="number"
                min={1}
                max={selectedStudio?.guests ?? 20}
                className="input-coquette"
                value={guests}
                onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
              />
            </label>

            <div className="price-hint">
              {rentalType === 'hourly' ? (
                <span>
                  {hours} giờ × {formatCurrency(selectedStudio?.pricePerHour ?? 0)} ={' '}
                  <strong>{formatCurrency(totalPrice)}</strong>
                </span>
              ) : (
                <span>
                  {nights} ngày × {formatCurrency(selectedStudio?.pricePerDay ?? 0)} ={' '}
                  <strong>{formatCurrency(totalPrice)}</strong>
                </span>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-body">
            <h2>3. Thông tin liên hệ</h2>
            <div className="notice-alert">
              Điền chính xác các thông tin <strong>bôi đỏ</strong> — shop sẽ liên hệ và xác nhận đơn
              qua Instagram của bạn.
            </div>
            <label className="field">
              <span className="field-label label-alert">Họ và tên *</span>
              <input
                className="input-coquette"
                placeholder="Nguyễn Văn A"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label label-alert">Số điện thoại *</span>
              <input
                className="input-coquette"
                inputMode="tel"
                placeholder="09xx xxx xxx"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label label-alert">Nick Instagram * (không cần dấu @)</span>
              <input
                className="input-coquette"
                placeholder="ví dụ: nganhaa"
                value={instagramNickname}
                onChange={(e) => setInstagramNickname(e.target.value)}
              />
              <small className="field-hint">
                Shop sẽ nhắn tin xác nhận đơn qua Instagram này — nhớ kiểm tra tin nhắn nhé!
              </small>
            </label>
            <label className="field">
              <span className="field-label">Ghi chú thêm (không bắt buộc)</span>
              <textarea
                className="input-coquette"
                rows={3}
                placeholder="Concept, phụ kiện cần thêm, thời gian đến sớm…"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">Hình thức thanh toán</span>
              <select
                className="input-coquette"
                value={depositChoice}
                onChange={(e) => setDepositChoice(e.target.value as 'deposit' | 'full')}
              >
                {DEPOSIT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            {step2Errors.length > 0 && (
              <div className="step-errors">
                <strong>Điền đủ thông tin bôi đỏ để tiếp tục:</strong>
                <ul>
                  {step2Errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {step === 3 && selectedStudio && (
          <div className="step-body confirm-grid">
            <div className="confirm-col">
              <h2>4. Xác nhận đặt phòng</h2>
              <div className="summary-card">
                <img src={selectedStudio.images[0]} alt={selectedStudio.name} />
                <div>
                  <strong>{selectedStudio.name}</strong>
                  <p className="muted">
                    <MapPin size={14} /> {selectedStudio.address}, {selectedStudio.city}
                  </p>
                </div>
              </div>
              <ul className="summary-list">
                <li>
                  <span>Thời gian</span>
                  <strong>
                    {rentalType === 'hourly'
                      ? `${formatDateVN(checkInDate)} · ${startTime} → ${addHoursToTime(startTime, hours)}`
                      : `${formatDateVN(checkInDate)} → ${formatDateVN(checkOutDate)}`}
                  </strong>
                </li>
                <li>
                  <span>Số khách</span>
                  <strong>{guests} người</strong>
                </li>
                <li>
                  <span>Người đặt</span>
                  <strong>{customerName}</strong>
                </li>
                <li>
                  <span>Điện thoại</span>
                  <strong>{customerPhone}</strong>
                </li>
                <li>
                  <span>Instagram</span>
                  <strong>@{instagramNickname.replace(/^@/, '')}</strong>
                </li>
                {specialRequests && (
                  <li>
                    <span>Ghi chú</span>
                    <strong>{specialRequests}</strong>
                  </li>
                )}
                <li className="summary-total">
                  <span>Tổng tiền</span>
                  <strong>{formatCurrency(totalPrice)}</strong>
                </li>
                <li className="summary-deposit">
                  <span>{depositChoice === 'full' ? 'Cần thanh toán' : 'Cần đặt cọc (30%)'}</span>
                  <strong>{formatCurrency(depositPrice)}</strong>
                </li>
              </ul>
            </div>

            <div className="confirm-col">
              <div className="payment-card">
                <h3>
                  <CreditCard size={18} /> Chuyển khoản đặt cọc
                </h3>
                {qrUrl ? (
                  <div className="qr-box">
                    <img src={qrUrl} alt="Mã QR chuyển khoản" />
                  </div>
                ) : (
                  <div className="qr-box qr-placeholder">Quét QR bằng app ngân hàng</div>
                )}
                <ul className="bank-list">
                  <li>
                    <span>Ngân hàng</span>
                    <strong>MBBank</strong>
                  </li>
                  <li>
                    <span>Số tài khoản</span>
                    <strong>
                      0369 399 740
                      <button type="button" onClick={() => handleCopy('0369399740', 'stk')}>
                        <Copy size={14} /> {copied === 'stk' ? 'Đã copy' : 'Copy'}
                      </button>
                    </strong>
                  </li>
                  <li>
                    <span>Chủ tài khoản</span>
                    <strong>CHUPCHOET ROOM STUDIO</strong>
                  </li>
                  <li>
                    <span>Số tiền</span>
                    <strong>
                      {formatCurrency(depositPrice)}
                      <button type="button" onClick={() => handleCopy(String(depositPrice), 'amt')}>
                        <Copy size={14} /> {copied === 'amt' ? 'Đã copy' : 'Copy'}
                      </button>
                    </strong>
                  </li>
                  <li>
                    <span>Nội dung CK</span>
                    <strong>
                      {paymentNote}
                      <button type="button" onClick={() => handleCopy(paymentNote, 'note')}>
                        <Copy size={14} /> {copied === 'note' ? 'Đã copy' : 'Copy'}
                      </button>
                    </strong>
                  </li>
                </ul>
                <div className="notice-alert">
                  Sau khi chuyển khoản, <strong>nhớ vào Instagram của shop</strong>{' '}
                  <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
                    @{INSTAGRAM_NICK}
                  </a>{' '}
                  nhắn mã đặt phòng để được xác nhận!
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="wizard-nav">
          {step > 0 && (
            <button type="button" className="ghost-button" onClick={() => setStep(step - 1)}>
              <ChevronLeft size={16} /> Quay lại
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              className="primary-button"
              disabled={!canGoNext}
              onClick={() => canGoNext && setStep(step + 1)}
            >
              Tiếp tục <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="primary-button"
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? 'Đang gửi…' : 'Gửi đặt phòng'}
            </button>
          )}
        </footer>
      </section>

      <p className="booking-foot muted">
        <Phone size={14} /> Cần hỗ trợ? Nhắn tin cho shop qua Instagram @{INSTAGRAM_NICK}
      </p>
    </main>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={<main className="booking-shell"><p className="muted">Đang tải…</p></main>}>
      <BookingWizard />
    </Suspense>
  )
}
