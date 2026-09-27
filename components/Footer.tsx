import Link from 'next/link'
import { AtSign } from "lucide-react"

const INSTAGRAM_URL = 'https://www.instagram.com/chupchoet.room'

export function Footer() {
  return (
    <footer className="footer-coquette">
      <div className="footer-inner">
        <div>
          <div className="footer-brand">chupchoet.room</div>
          <p className="footer-desc">
            Cho thuê phòng Studio chụp ảnh & không gian sáng tạo chuyên nghiệp.
          </p>
        </div>
        <div className="footer-links">
          <Link href="/#studios">Khám phá Studio</Link>
          <Link href="/booking">Đặt lịch ngay</Link>
          <Link href="/my-bookings">Tra cứu đơn thuê</Link>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="footer-ig">
            <AtSign size={14} /> @chupchoet.room
          </a>
          <Link href="/admin/khanh" className="footer-admin" title="Trang quản trị dành riêng cho Khanh">
            🔒 Dành cho Admin
          </Link>
        </div>
        <div className="footer-copy">
          © {new Date().getFullYear()} chupchoet.room · Photography Studio Rental
        </div>
      </div>
    </footer>
  )
}
