'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Phone,
  User,
  Ticket,
  Printer,
  Home,
  Clock,
  Sparkles,
  Camera,
  AtSign,
} from 'lucide-react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { formatCurrency } from '@/lib/data'
import { getBookings } from '@/lib/services'

const INSTAGRAM_URL = 'https://www.instagram.com/chupchoet.room'

export default function BookingSuccessPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params)
  const [booking, setBooking] = useState<any>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    getBookings()
      .then((bookings) => {
        if (!active) return
        setBooking(bookings.find((b) => b.code === resolvedParams.code) ?? null)
        setLoaded(true)
      })
      .catch(() => {
        if (active) setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [resolvedParams.code])

  if (!booking) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="my-20 text-center">
          {loaded ? (
            <>
              <p className="muted">
                Không tìm thấy vé với mã <b>{resolvedParams.code}</b>.
              </p>
              <Link href="/my-bookings" className="primary-button compact mt-4">
                Xem đơn đặt của tôi
              </Link>
            </>
          ) : (
            <p className="muted">Đang tải thông tin vé studio…</p>
          )}
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-3xl px-5">
          {/* Header */}
          <div className="success-head">
            <div className="success-icon">
              <CheckCircle2 size={40} strokeWidth={1.6} />
            </div>
            <h1>Đã nhận đơn đặt giữ Studio!</h1>
            <p>
              Cảm ơn bạn đã lựa chọn <b>chupchoet.room</b>. Thông tin vé chụp của bạn đã được ghi
              nhận.
            </p>
          </div>

          {/* Ticket */}
          <div className="ticket">
            <div className="ticket-top">
              <div>
                <span className="ticket-brand">
                  <Camera size={13} /> chupchoet.room Pass
                </span>
                <div className="ticket-code">{booking.code}</div>
              </div>
              <span className="ticket-status">
                <Sparkles size={14} /> Chờ xác nhận qua Instagram
              </span>
            </div>

            <div className="ticket-body">
              {/* Studio */}
              <div className="ticket-studio">
                <img src={booking.studioImage} alt={booking.studioName} />
                <div>
                  <h2>{booking.studioName}</h2>
                  <p>
                    <MapPin size={13} /> {booking.studioAddress}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="ticket-grid">
                <div>
                  <span className="ticket-label">
                    <Calendar size={13} /> Ngày nhận Studio
                  </span>
                  <strong>{booking.checkIn}</strong>
                  <small>
                    <Clock size={12} /> Chuẩn bị trước 10-15 phút
                  </small>
                </div>
                <div>
                  <span className="ticket-label">
                    <Calendar size={13} /> Ngày hoàn tất
                  </span>
                  <strong>{booking.checkOut}</strong>
                  <small>
                    <Clock size={12} /> Dọn dẹp thiết bị đúng giờ
                  </small>
                </div>
                <div>
                  <span className="ticket-label">
                    <User size={13} /> Người đặt / Ekip
                  </span>
                  <strong>{booking.customerName}</strong>
                  <small>
                    <Phone size={12} /> {booking.customerPhone}
                  </small>
                  {booking.instagramNickname && (
                    <small>
                      <AtSign size={12} /> Instagram: @{booking.instagramNickname}
                    </small>
                  )}
                </div>
                <div>
                  <span className="ticket-label">
                    <Ticket size={13} /> Số lượng & Thời gian
                  </span>
                  <strong>
                    {booking.guests || 4} người trong ekip · {booking.nights || 1} khung thời gian
                  </strong>
                </div>
              </div>

              {/* Instagram notice */}
              <div className="notice-alert">
                <strong>⚠️ NHỚ ĐỌC — XÁC NHẬN ĐƠN HÀNG:</strong> Sau khi chuyển khoản, vui lòng{' '}
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                  vào tài khoản Instagram @chupchoet.room
                </a>{' '}
                để xác nhận đơn. Đơn sẽ được chốt sau khi shop kiểm tra chuyển khoản.
              </div>

              {/* Price summary */}
              <div className="ticket-prices">
                <div>
                  <span>Tổng chi phí Studio:</span>
                  <strong>{formatCurrency(booking.totalPrice)}</strong>
                </div>
                <div>
                  <span>Đã cọc 30% VietQR:</span>
                  <strong className="hot">{formatCurrency(booking.depositPrice)}</strong>
                </div>
                <div className="ticket-rest">
                  <span>Còn lại thanh toán tại Studio:</span>
                  <strong>{formatCurrency(booking.totalPrice - booking.depositPrice)}</strong>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="ticket-foot">
              <span className="ticket-pass">PASS-{booking.code}</span>
              <div className="ticket-actions">
                <button onClick={() => window.print()} className="ghost-button compact">
                  <Printer size={14} /> Lưu / In vé
                </button>
                <Link href="/my-bookings" className="primary-button compact">
                  Đơn đặt của tôi
                </Link>
              </div>
            </div>
          </div>

          <div className="success-back">
            <Link href="/" className="back-link">
              <Home size={16} /> Quay lại danh sách Studio
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
