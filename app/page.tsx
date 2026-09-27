'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarCheck,
  Camera,
  Heart,
  AtSign,
  MapPin,
  MessageCircleHeart,
  Moon,
  Sparkles,
  Star,
  Timer,
  Users,
} from 'lucide-react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Studio, formatCurrency } from '@/lib/data'
import { getRooms } from '@/lib/services'

const INSTAGRAM_NICK = 'chupchoet.room'
const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_NICK}`

export default function HomePage() {
  const [allListings, setAllListings] = useState<Studio[]>([])
  const [selectedCity, setSelectedCity] = useState('All')

  useEffect(() => {
    let active = true
    getRooms()
      .then((rooms) => {
        if (active) setAllListings(rooms)
      })
      .catch(() => {
        if (active) setAllListings([])
      })
    return () => {
      active = false
    }
  }, [])

  const cities = useMemo(
    () => ['All', ...Array.from(new Set(allListings.map((s) => s.city)))],
    [allListings],
  )

  const visibleListings = useMemo(
    () => allListings.filter((item) => selectedCity === 'All' || item.city === selectedCity),
    [allListings, selectedCity],
  )

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="hero-wrap">
          <div className="hero-inner">
            <span className="brand-pill">
              <Sparkles size={14} /> chupchoet.room studio
            </span>
            <h1>
              Ghi lại khoảnh khắc
              <br />
              <span className="hero-accent">của riêng bạn.</span>
            </h1>
            <p>
              Studio chụp ảnh & concept nghệ thuật — đèn trợ sáng, phông nền vô cực, đạo cụ hiện
              đại. Đặt lịch chỉ vài phút, xác nhận qua Instagram.
            </p>
            <div className="hero-cta">
              <Link href="/booking" className="primary-button">
                <CalendarCheck size={18} /> Đặt lịch ngay
              </Link>
              <a href="#studios" className="ghost-button">
                Xem các studio <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </section>

        {/* Feature chips */}
        <section className="feature-strip">
          <div className="feature-chip">
            <Camera size={18} />
            <div>
              <strong>Thiết bị trợ sáng đầy đủ</strong>
              <span>Đèn Godox, hắt sáng & softbox</span>
            </div>
          </div>
          <div className="feature-chip">
            <Timer size={18} />
            <div>
              <strong>Thuê linh hoạt theo giờ</strong>
              <span>Chỉ từ 150k/h cho mọi ekip</span>
            </div>
          </div>
          <div className="feature-chip">
            <Sparkles size={18} />
            <div>
              <strong>Tặng preset màu độc quyền</strong>
              <span>Ảnh có hồn ngay sau khi chụp</span>
            </div>
          </div>
          <div className="feature-chip">
            <MessageCircleHeart size={18} />
            <div>
              <strong>Xác nhận qua Instagram</strong>
              <span>Nhắn tin chốt lịch cực nhanh</span>
            </div>
          </div>
        </section>

        {/* Studio grid */}
        <section id="studios" className="listing-section">
          <div className="listing-head">
            <div>
              <div className="eyebrow">chupchoet.room studios</div>
              <h2>Không gian sáng tạo</h2>
            </div>
            <label className="city-filter">
              <MapPin size={16} />
              <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c === 'All' ? 'Tất cả khu vực' : c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="listing-grid">
            {visibleListings.map((item) => (
              <article key={item.id} className="listing-card polaroid">
                <Link href={`/rooms/${item.id}`}>
                  <div className="listing-photo">
                    <img src={item.images[0]} alt={item.name} loading="lazy" />
                    <span className="rating">
                      <Star size={12} fill="currentColor" /> {item.rating}
                    </span>
                  </div>
                  <div className="listing-body">
                    <h3>{item.name}</h3>
                    <p className="listing-addr">
                      <MapPin size={13} /> {item.address}
                    </p>
                    <div className="listing-prices">
                      <span>
                        <Timer size={13} /> <strong>{formatCurrency(item.pricePerHour)}</strong>/giờ
                      </span>
                      <span>
                        <Moon size={13} /> <strong>{formatCurrency(item.pricePerDay)}</strong>/ngày
                      </span>
                    </div>
                    <div className="listing-meta">
                      <span>
                        <Camera size={13} /> {item.type}
                      </span>
                      <span>
                        <Users size={13} /> {item.guests} khách
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          {visibleListings.length === 0 && (
            <p className="listing-empty">Chưa có studio nào ở khu vực này.</p>
          )}
        </section>

        {/* How it works */}
        <section className="how-strip">
          <div className="how-step">
            <span className="how-dot">1</span>
            <strong>Chọn studio & thời gian</strong>
            <p>Theo giờ hoặc trọn ngày, vài cú click là xong.</p>
          </div>
          <div className="how-step">
            <span className="how-dot">2</span>
            <strong>Chuyển khoản đặt cọc</strong>
            <p>Quét QR MBBank, nội dung chuyển khoản có sẵn.</p>
          </div>
          <div className="how-step">
            <span className="how-dot">3</span>
            <strong>Nhắn Instagram xác nhận</strong>
            <p>
              Inbox{' '}
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
                @{INSTAGRAM_NICK}
              </a>{' '}
              để shop chốt lịch cho bạn.
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="story-wrap">
          <span className="brand-pill">
            <Heart size={14} /> Câu chuyện chupchoet.room
          </span>
          <h2>Khởi nguồn từ đam mê nhiếp ảnh & khát khao sáng tạo</h2>
          <blockquote>
            "Chúng mình đầu tư không gian studio phong phú và hệ thống ánh sáng cao cấp, để bất kỳ ai
            cũng chạm được tới trải nghiệm chụp ảnh chuyên nghiệp — chỉ từ 150k."
          </blockquote>
          <p className="story-sign">— Founder & Creative Team, chupchoet.room</p>
          <a className="primary-button" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
            <AtSign size={18} /> Follow @{INSTAGRAM_NICK}
          </a>
        </section>
      </main>

      <Footer />
    </div>
  )
}
