'use client'

import Link from 'next/link'
import { Camera, Ticket, Menu, X, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [hidden, setHidden] = useState(false)

  // Hide header on scroll down, reveal on scroll up (mobile-native feel)
  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setHidden(y > lastY && y > 120)
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`site-header sticky top-0 z-30 ${hidden ? 'is-hidden' : ''}`}>
      <div className="header-inner">
        <Link href="/" className="header-brand">
          <span className="brand-mark">
            <Camera size={20} />
          </span>
          <span>
            <span className="brand-name">chupchoet.room</span>
            <span className="brand-sub">Photography Studio Rental</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="header-nav">
          <Link href="/#studios">Danh sách Studio</Link>
          <Link href="/booking">Đặt lịch ngay</Link>
          <Link href="/my-bookings" className="nav-ticket">
            <Ticket size={15} /> Tra cứu đơn thuê
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="header-burger"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="header-mobile">
          <Link href="/#studios" onClick={() => setMobileMenuOpen(false)}>
            Danh sách Studio
          </Link>
          <Link href="/booking" onClick={() => setMobileMenuOpen(false)}>
            <Sparkles size={15} /> Đặt lịch ngay
          </Link>
          <Link href="/my-bookings" onClick={() => setMobileMenuOpen(false)}>
            <Ticket size={15} /> Tra cứu đơn thuê
          </Link>
        </div>
      )}
    </header>
  )
}
