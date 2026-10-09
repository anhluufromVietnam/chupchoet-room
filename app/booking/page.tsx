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
import { Studio, PaymentSettings, formatCurrency, defaultPaymentSettings } from '@/lib/data'
import { getRooms, createBooking, getPaymentSettings } from '@/lib/services'
import { CoquetteDatePicker, CoquetteTimePicker, CoquetteHoursInput } from '@/components/BookingPickers'

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
  const [cardImg, setCardImg] = useState<Record<string, number>>({})
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
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(defaultPaymentSettings)

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
    getPaymentSettings()
      .then((settings) => {
        if (active) setPaymentSettings(settings)
      })
      .catch(() => {
        // keep defaults
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

  const depositPrice = depositChoice === 'full' ? totalPrice : Math.round(totalPrice * (paymentSettings.depositPercent / 100))

  const paymentNote = `CHUPCHOET ${customerPhone || 'SODT'}`

  // Normalized phone: keep digits only, convert +84 prefix to 0
  const normalizedPhone = (() => {
    let digits = customerPhone.replace(/\D/g, '')
    if (digits.startsWith('84') && digits.length >= 10) digits = `0${digits.slice(2)}`
    return digits
  })()

  const step2Errors: string[] = []
  if (customerName.trim().length < 2) step2Errors.push('Họ và tên')
  if (!/^[0-9]{9,11}$/.test(normalizedPhone))
    step2Errors.push('Số điện thoại chưa đúng, cần 9 - 11 số (VD: 0912345678)')
  if (instagramNickname.trim().length < 3)
    step2Errors.push('Tài khoản Instagram')
  // Map tên ngân hàng sang mã bank cho VietQR (dùng khi chưa upload ảnh QR riêng)
  const vietqrBankCode = useMemo(() => {
    const name = paymentSettings.bankName.toLowerCase()
    if (name.includes('mb') || name.includes('quân đội')) return 'MB'
    if (name.includes('vietcom')) return 'VCB'
    if (name.includes('techcom')) return 'TCB'
    if (name.includes('vpbank')) return 'VPB'
    if (name.includes('bidv')) return 'BIDV'
    if (name.includes('vietin')) return 'CTG'
    if (name.includes('agribank')) return 'AGR'
    if (name.includes('acb')) return 'ACB'
    if (name.includes('tpbank')) return 'TPB'
    if (name.includes('sacombank')) return 'SCB'
    return 'MB'
  }, [paymentSettings.bankName])

  const qrUrl = useMemo(() => {
    if (!selectedStudio || totalPrice <= 0) return null
    // Ưu tiên ảnh QR do admin upload
    if (paymentSettings.qrImageUrl) return paymentSettings.qrImageUrl
    const params = new URLSearchParams({
      amount: String(depositPrice),
      addInfo: paymentNote,
      accountName: paymentSettings.accountHolder || 'CHUPCHOET ROOM STUDIO',
    })
    const account = paymentSettings.accountNumber.replace(/\s/g, '') || '0369399740'
    return `https://img.vietqr.io/image/${vietqrBankCode}-${account}-compact2.png?${params.toString()}`
  }, [selectedStudio, totalPrice, depositPrice, paymentNote, paymentSettings, vietqrBankCode])

  const stepValid = (index: number): boolean => {
    if (index === 0) return Boolean(selectedStudio)
    if (index === 1) {
      return Boolean(checkInDate) && hoursCount > 0
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
    navigator.clipboard?.writeText(text.replace(/\s/g, '')).catch(() => { })
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
                  const imgIdx = ((cardImg[s.id] ?? 0) % s.images.length + s.images.length) % s.images.length
                  return (
                    <div
                      key={s.id}
                      role="button"
                      tabIndex={0}
                      className={`studio-card ${active ? 'selected' : ''}`}
                      onClick={() => setStudioId(s.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setStudioId(s.id)
                        }
                      }}
                    >
                      <div className="studio-card-photo">
                        <img src={s.images[imgIdx]} alt={s.name} />
                        {s.images.length > 1 && (
                          <>
                            <button
                              type="button"
                              className="studio-card-nav prev"
                              aria-label="Ảnh trước"
                              onClick={(e) => {
                                e.stopPropagation()
                                setCardImg((m) => ({ ...m, [s.id]: (imgIdx - 1 + s.images.length) % s.images.length }))
                              }}
                            >
                              <ChevronLeft size={15} />
                            </button>
                            <button
                              type="button"
                              className="studio-card-nav next"
                              aria-label="Ảnh sau"
                              onClick={(e) => {
                                e.stopPropagation()
                                setCardImg((m) => ({ ...m, [s.id]: (imgIdx + 1) % s.images.length }))
                              }}
                            >
                              <ChevronRight size={15} />
                            </button>
                            <div className="studio-card-dots">
                              {s.images.map((_, di) => (
                                <span key={di} className={`studio-card-dot ${di === imgIdx ? 'active' : ''}`} />
                              ))}
                            </div>
                          </>
                        )}
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
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="step-body">
            <h2>2. Chọn thời gian thuê</h2>

            <div className="field-row">
              <CoquetteDatePicker
                label="Ngày chụp"
                value={checkInDate}
                minDate={toDateInputValue(new Date())}
                onChange={(val) => setCheckInDate(val)}
              />
              <CoquetteTimePicker
                label="Giờ bắt đầu"
                value={startTime}
                options={TIME_OPTIONS}
                onChange={(val) => setStartTime(val)}
              />
              <CoquetteHoursInput
                label="Số giờ thuê"
                value={hoursCount}
                min={1}
                max={24}
                onChange={(val) => setHoursCount(val)}
              />
            </div>

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
            <h2>3. Thông tin khách hàng</h2>
            <p className="muted">
              Vui lòng điền đầy đủ thông tin để hoàn tất đặt thuê studio.

            </p>


            <div className="customer-details-grid">
              <label className="field">
                <span className="field-label">Họ và tên *</span>
                <input
                  className="input-coquette"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nhập họ và tên"
                />
              </label>

              <label className="field">
                <span className="field-label">Số điện thoại *</span>
                <input
                  type="tel"
                  className="input-coquette"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Nhập số điện thoại"
                />
              </label>

              <label className="field customer-details-full">
                <span className="field-label instagram-alert">
                  ⚠️ Tài khoản Instagram *
                </span>
                <input
                  type="text"
                  className="input-coquette"
                  style={{ borderColor: '#f87171' }}
                  value={instagramNickname}
                  onChange={(e) => setInstagramNickname(e.target.value)}
                  placeholder="Nhập tài khoản Instagram"
                />
              </label>

              <label className="field customer-details-full">
                <span className="field-label">Ghi chú</span>
                <textarea
                  className="input-coquette"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Ghi chú thêm về yêu cầu thuê studio (tùy chọn)"
                  rows={3}
                />
              </label>

              <label className="field customer-details-full">
                <span className="field-label">Hình thức thanh toán</span>
                <select
                  className="input-coquette"
                  value={depositChoice}
                  onChange={(e) =>
                    setDepositChoice(e.target.value as 'deposit' | 'full')
                  }
                >
                  {DEPOSIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {step2Errors.length > 0 && (
              <div className="step-errors">
                <strong>Điền đủ thông tin để tiếp tục:</strong>
                <ul>
                  {step2Errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <style jsx>{`
      .customer-details-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 24px;
      }

      .instagram-alert {
        font-weight: 900;
        text-transform: uppercase;
        animation: blinkRedBlack 0.8s infinite;
      }

      @keyframes blinkRedBlack {
        0%, 100% { color: black; }
        50% { color: red; }
      }

      @media (min-width: 640px) {
        .customer-details-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .customer-details-full {
          grid-column: 1 / -1;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .instagram-alert {
          animation: none;
          color: #dc2626;
        }
      }
    `}</style>
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
                  <span>{depositChoice === 'full' ? 'Cần thanh toán' : `Cần đặt cọc (${paymentSettings.depositPercent}%)`}</span>
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
                    <strong>{paymentSettings.bankName.replace(/\(.*\)/, '').trim() || 'MBBank'}</strong>
                  </li>
                  <li>
                    <span>Số tài khoản</span>
                    <strong>
                      {paymentSettings.accountNumber}
                      <button type="button" onClick={() => handleCopy(paymentSettings.accountNumber.replace(/\s/g, ''), 'stk')}>
                        <Copy size={14} /> {copied === 'stk' ? 'Đã copy' : 'Copy'}
                      </button>
                    </strong>
                  </li>
                  <li>
                    <span>Chủ tài khoản</span>
                    <strong>{paymentSettings.accountHolder}</strong>
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
                <div className="payment-confirm-notice">
                  <h3 className="payment-confirm-title">
                    Xác nhận đặt thuê
                  </h3>

                  <p className="alert-blink">
                    Khách hàng vui lòng gửi bill chuyển khoản về Fanpage hoặc{' '}
                    <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
                      Instagram @{INSTAGRAM_NICK}
                    </a>
                  </p>

                  <p className="alert-blink">
                    Nếu không shop sẽ không xác nhận đơn
                  </p>

                  <style jsx>{`
    .payment-confirm-notice {
      width: 100%;
      max-width: 896px;
      margin: 0 auto;
      padding: 16px;
      text-align: center;
      border: 1px solid #fecaca;
      border-radius: 12px;
      background: #fff7f7;
    }

    .payment-confirm-title {
      display: block;
      margin: 0 0 8px;
      font-size: 20px;
      font-weight: 700;
      text-align: center;
    }

    .alert-blink {
      margin: 4px 0;
      line-height: 1.4;
      animation: paymentAlertBlink 0.8s infinite;
    }

    .alert-blink a {
      color: inherit;
      font-weight: 700;
      text-decoration: underline;
    }

    @keyframes paymentAlertBlink {
      0%, 100% { color: black; }
      50% { color: red; }
    }

    @media (min-width: 768px) {
      .payment-confirm-title {
        font-size: 24px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .alert-blink {
        animation: none;
        color: #dc2626;
      }
    }
  `}</style>
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
