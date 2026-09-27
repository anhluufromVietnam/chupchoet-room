'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Ticket, Calendar, MapPin, ArrowRight, Camera } from 'lucide-react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { formatCurrency } from '@/lib/data'
import { getBookings } from '@/lib/services'

export default function MyBookingsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [bookings, setBookings] = useState<any[]>([])

  useEffect(() => {
    let active = true

    getBookings()
      .then((data) => {
        if (active) setBookings(data)
      })
      .catch(() => {
        if (active) setBookings([])
      })

    return () => {
      active = false
    }
  }, [])

  const filteredBookings = bookings.filter(
    (b) =>
      b.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerPhone?.includes(searchQuery) ||
      b.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-5xl px-5">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <div className="brand-pill">
              <Camera size={14} /> Tra cứu lịch đặt Studio
            </div>
            <h1 className="section-title">Tra cứu đơn đặt chupchoet.room</h1>
            <p className="muted text-sm font-medium">
              Nhập Số điện thoại, Tên Ekip hoặc Mã đơn đặt (ví dụ: CHUP-123456) để kiểm tra vé Studio.
            </p>

            <div className="mt-6 flex gap-2">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400" />
                <input
                  type="text"
                  placeholder="Nhập SĐT hoặc Mã đơn đặt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-coquette w-full pl-11"
                />
              </div>
            </div>
          </div>

          <div className="mt-12 space-y-6">
            <h2 className="section-title text-left text-2xl">
              {searchQuery
                ? `Kết quả tìm kiếm (${filteredBookings.length})`
                : `Tất cả đơn đặt đã lưu (${bookings.length})`}
            </h2>

            {filteredBookings.length === 0 ? (
              <div className="empty-state">
                <Ticket size={44} strokeWidth={1.4} />
                <p className="empty-title">Chưa tìm thấy đơn đặt Studio nào</p>
                <p className="muted text-xs font-medium">
                  Hãy kiểm tra lại Số điện thoại hoặc Mã đơn hàng bạn đã dùng khi đặt giữ lịch.
                </p>
                <Link href="/#studios" className="primary-button mt-6 inline-flex">
                  Khám phá Studio ngay
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredBookings.map((b) => (
                  <div key={b.code} className="booking-row">
                    <div className="flex items-center gap-4">
                      <img
                        src={b.studioImage}
                        alt={b.studioName}
                        className="booking-row-photo"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="booking-code">{b.code}</span>
                          <span className="booking-tag">Đã cọc VietQR</span>
                        </div>
                        <h3 className="booking-row-name">{b.studioName}</h3>
                        <div className="booking-row-meta">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {b.checkIn} — {b.checkOut}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={12} /> {b.customerName} ({b.customerPhone})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="booking-row-side">
                      <div className="text-right">
                        <div className="muted text-xs font-medium">Tổng chi phí</div>
                        <div className="booking-row-price">{formatCurrency(b.totalPrice)}</div>
                      </div>
                      <Link href={`/booking/success/${b.code}`} className="primary-button compact">
                        Xem Vé Studio <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
