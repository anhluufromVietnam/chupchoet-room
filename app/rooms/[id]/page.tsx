'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  MapPin,
  Moon,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
  Users,
  Wifi,
  X,
} from 'lucide-react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Studio, formatCurrency, DEFAULT_STUDIO_IMAGE } from '@/lib/data'
import { getRoomById } from '@/lib/services'

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [room, setRoom] = useState<Studio | null>(null)
  const [lightbox, setLightbox] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    getRoomById(resolvedParams.id)
      .then((data) => {
        if (active) setRoom(data ?? null)
      })
      .catch(() => {
        if (active) setRoom(null)
      })
    return () => {
      active = false
    }
  }, [resolvedParams.id])

  useEffect(() => {
    if (lightbox === null || !room) return
    const total = room.images.length
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
      else if (e.key === 'ArrowLeft') setLightbox((i) => (i === null ? i : (i - 1 + total) % total))
      else if (e.key === 'ArrowRight') setLightbox((i) => (i === null ? i : (i + 1) % total))
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [lightbox, room])

  if (!room) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="my-20 text-center">
          <h1 className="font-serif text-3xl" style={{ color: 'var(--ink)' }}>
            Đang tải Studio...
          </h1>
          <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>
            Đang lấy thông tin studio từ Firestore.
          </p>
          <Link href="/" className="primary-button mt-6">
            Quay lại trang chủ
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  const bookingHref = `/booking?studioId=${room.id}`

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 pb-16">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-6xl px-5 pt-6">
          <Link href="/" className="back-link">
            <ChevronLeft size={16} /> Xem tất cả Studio
          </Link>
        </div>

        {/* Title */}
        <section className="mx-auto max-w-6xl px-5 pt-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="eyebrow">{room.type}</div>
              <h1 className="detail-title">{room.name}</h1>
              <p className="detail-addr">
                <MapPin size={15} /> {room.address}, {room.city}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rating">
                <Star size={14} fill="currentColor" /> <b>{room.rating}</b>{' '}
                <span>({room.reviewCount} đánh giá)</span>
              </div>
              <button
                className="ghost-button compact"
                onClick={() => alert('Đã lưu vào danh sách yêu thích')}
              >
                <Heart size={14} /> Lưu lại
              </button>
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section className="mx-auto mt-6 max-w-6xl px-5">
          <div className="detail-gallery">
            <button
              type="button"
              className="detail-gallery-main"
              aria-label="Xem ảnh lớn"
              onClick={() => setLightbox(0)}
            >
              <img src={room.images?.[0] || DEFAULT_STUDIO_IMAGE} alt={room.name} />
            </button>
            {room.images.slice(1, 5).map((img, idx) => {
              const extra = room.images.length - 5
              const showMore = idx === 3 && extra > 0
              return (
                <button
                  key={idx}
                  type="button"
                  className="detail-gallery-thumb"
                  aria-label={`Xem ảnh ${idx + 2}`}
                  onClick={() => setLightbox(idx + 1)}
                >
                  <img src={img} alt={`${room.name} ${idx + 2}`} />
                  {showMore && <span className="gallery-more">+{extra}</span>}
                </button>
              )
            })}
          </div>
        </section>

        {/* Lightbox */}
        {lightbox !== null && room.images.length > 0 && (
          <div className="lightbox" role="dialog" aria-label="Xem ảnh" onClick={() => setLightbox(null)}>
            <button
              type="button"
              className="lightbox-close"
              aria-label="Đóng"
              onClick={() => setLightbox(null)}
            >
              <X size={20} />
            </button>
            <button
              type="button"
              className="lightbox-nav prev"
              aria-label="Ảnh trước"
              onClick={(e) => {
                e.stopPropagation()
                setLightbox((lightbox - 1 + room.images.length) % room.images.length)
              }}
            >
              <ChevronLeft size={24} />
            </button>
            <img
              src={room.images[lightbox]}
              alt={`${room.name} ${lightbox + 1}`}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              className="lightbox-nav next"
              aria-label="Ảnh sau"
              onClick={(e) => {
                e.stopPropagation()
                setLightbox((lightbox + 1) % room.images.length)
              }}
            >
              <ChevronRight size={24} />
            </button>
            <div className="lightbox-counter">
              {lightbox + 1} / {room.images.length}
            </div>
          </div>
        )}

        {/* Content + booking dock */}
        <section className="detail-layout mx-auto mt-10 max-w-6xl px-5">
          <div className="detail-main">
            {/* Price badges */}
            <div className="price-badges">
              <span className="price-badge hot">
                <Timer size={16} /> {formatCurrency(room.pricePerHour)} <em>/ giờ</em>
              </span>
              <span className="price-badge">
                <Moon size={16} /> {formatCurrency(room.pricePerDay)} <em>/ ngày</em>
              </span>
            </div>

            {/* Quick facts */}
            <div className="detail-facts">
              <span>
                <Camera size={16} /> {room.type}
              </span>
              <span>
                <Users size={16} /> Tối đa {room.guests} khách
              </span>
              <span>
                <Wifi size={16} /> Wifi 5G
              </span>
            </div>

            {/* Host */}
            <div className="detail-card host-card">
              <img src={room.host.avatar} alt={room.host.name} />
              <div>
                <strong>Quản lý bởi {room.host.name}</strong>
                <p>
                  Kinh nghiệm từ {room.host.joinedYear} · Tỷ lệ phản hồi {room.host.responseRate}
                </p>
              </div>
              {room.host.isSuperhost && (
                <span className="host-badge">
                  <ShieldCheck size={14} /> Verified Host
                </span>
              )}
            </div>

            {/* Description */}
            <div className="detail-card">
              <h2>Giới thiệu về Studio</h2>
              <p className="detail-desc">{room.description}</p>
            </div>

            {/* Amenities */}
            <div className="detail-card">
              <h2>Thiết bị & Tiện ích sẵn có</h2>
              <div className="amenity-grid">
                {room.amenities.map((cat) => (
                  <div key={cat.category} className="amenity-group">
                    <h3>{cat.category}</h3>
                    <ul>
                      {cat.items.map((item) => (
                        <li key={item}>
                          <Check size={15} /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Rules */}
            <div className="detail-card">
              <h2>Quy định sử dụng Studio</h2>
              <ul className="rule-list">
                {room.rules.map((rule, i) => (
                  <li key={i}>
                    <Clock size={15} /> {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Booking dock */}
          <aside className="detail-aside">
            <div className="detail-dock panel">
              <div className="dock-price">
                <strong>{formatCurrency(rentalModePrice(room))}</strong>
                <span>/ giờ</span>
              </div>
              <div className="dock-note">
                <Sparkles size={14} /> Đặt cọc 30% giữ chỗ — phần còn lại thanh toán khi đến.
              </div>
              <Link href={bookingHref} className="primary-button dock-cta">
                Đặt lịch ngay <ArrowRight size={18} />
              </Link>
              <p className="dock-hint">Xác nhận qua Instagram · Hỗ trợ đổi ca chụp</p>
            </div>
          </aside>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function rentalModePrice(room: Studio): number {
  return room.pricePerHour || room.pricePerDay
}
