import { promises as fs } from 'fs'
import path from 'path'
import { Studio, BookingData, PaymentSettings, defaultPaymentSettings, DEFAULT_STUDIO_IMAGE } from './data'

const DATA_DIR = path.join(process.cwd(), 'data')
const DB_FILE = path.join(DATA_DIR, 'db.json')

export interface DbShape {
  rooms: Studio[]
  bookings: BookingData[]
  settings: { payment: PaymentSettings }
}

export const seedRoom: Studio = {
  id: 'phong-1',
  name: 'Phòng 1',
  type: 'Photo Studio',
  city: 'Da Lat',
  address: 'Địa chỉ studio',
  price: 1200000,
  pricePerDay: 1200000,
  pricePerHour: 150000,
  rating: 5,
  reviewCount: 1,
  guests: 2,
  bedrooms: 1,
  beds: 1,
  baths: 1,
  images: [DEFAULT_STUDIO_IMAGE],
  tags: ['Studio', 'Chụp ảnh', 'Mới'],
  accent: '#ff4d94',
  description: 'Studio chụp ảnh hiện đại, phù hợp cho chụp ảnh theo giờ và theo ngày.',
  host: {
    name: 'Chupchoet',
    avatar: DEFAULT_STUDIO_IMAGE,
    isSuperhost: true,
    responseRate: '100%',
    joinedYear: '2024',
  },
  amenities: [
    { category: 'General', items: ['Wi-Fi', 'Máy lạnh', 'Phòng thay đồ'] },
    { category: 'Lighting', items: ['Đèn LED', 'Softbox'] },
  ],
  rules: ['Check-in 14:00', 'Check-out 12:00', 'Không hút thuốc trong phòng'],
}

function freshDb(): DbShape {
  return { rooms: [seedRoom], bookings: [], settings: { payment: { ...defaultPaymentSettings } } }
}

export async function readDb(): Promise<DbShape> {
  try {
    const raw = await fs.readFile(DB_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    return {
      rooms: Array.isArray(parsed.rooms) ? parsed.rooms : [],
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
      settings: {
        payment: { ...defaultPaymentSettings, ...(parsed.settings?.payment ?? {}) },
      },
    }
  } catch {
    const fresh = freshDb()
    await writeDb(fresh)
    return fresh
  }
}

export async function writeDb(db: DbShape): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf-8')
}

export async function resetDb(): Promise<DbShape> {
  const fresh = freshDb()
  await writeDb(fresh)
  return fresh
}
