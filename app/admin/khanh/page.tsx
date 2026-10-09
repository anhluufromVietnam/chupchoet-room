'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BookingCalendar from '@/components/BookingCalendar'
import {
  ArrowRight,
  Box,
  Calendar,
  CheckCircle,
  Clock,
  Home,
  LogOut,
  Plus,
  QrCode,
  Settings,
  ShieldCheck,
  TrendingUp,
  User,
  X,
  Camera,
  Layers,
  ChevronDown,
  Trash2,
  Edit,
  Building,
  TriangleAlert,
  Upload,
} from 'lucide-react'
import {
  Studio,
  BookingData,
  BookingStatus,
  formatCurrency,
  defaultPaymentSettings,
  PaymentSettings,
  DEFAULT_STUDIO_IMAGE,
} from '@/lib/data'
import {
  deleteBooking,
  deleteRoom,
  getBookings,
  getPaymentSettings,
  getRooms,
  savePaymentSettings,
  saveRoom,
  updateBooking,
  updateBookingStatus,
  uploadImages,
  logoutAdmin,
} from '@/lib/services'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [auth, setAuth] = useState<{ username: string; loggedIn: boolean } | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [activeTab, setActiveTab] = useState<'phong' | 'donhang' | 'lich' | 'quanly' | 'caidat'>('quanly')

  // Rooms state
  const [roomsList, setRoomsList] = useState<Studio[]>([])
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false)
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)
  const [newRoom, setNewRoom] = useState({
    name: '',
    type: '',
    city: 'Da Lat',
    address: '',
    pricePerHour: 150000,
    pricePerDay: 1200000,
    guests: 2,
    bedrooms: 1,
    beds: 1,
    baths: 1,
    description: '',
    amenitiesText: '',
    rulesText: '',
  })
  const [roomImages, setRoomImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [roomActionToast, setRoomActionToast] = useState<{ message: string; show: boolean }>({
    message: '',
    show: false,
  })
  const [deleteRoomConfirm, setDeleteRoomConfirm] = useState<{ roomId: string | null; show: boolean }>({
    roomId: null,
    show: false,
  })

  useEffect(() => {
    if (!roomActionToast.show) return

    const timer = setTimeout(() => {
      setRoomActionToast((prev) => ({ ...prev, show: false }))
    }, 2200)

    return () => clearTimeout(timer)
  }, [roomActionToast.show])

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    setUploadingImages(true)
    try {
      const urls = await uploadImages(files)
      setRoomImages((prev) => [...prev, ...urls])
    } catch (error) {
      console.error('Error uploading images:', error)
      setRoomActionToast({
        message: error instanceof Error ? error.message : 'Upload ảnh thất bại!',
        show: true,
      })
    } finally {
      setUploadingImages(false)
    }
  }

  const removeRoomImage = (index: number) => {
    setRoomImages((prev) => prev.filter((_, i) => i !== index))
  }

  const addImageUrl = () => {
    const url = imageUrlInput.trim()
    if (!url) return
    setRoomImages((prev) => [...prev, url])
    setImageUrlInput('')
  }

  const resetRoomForm = () => {
    setNewRoom({
      name: '',
      type: '',
      city: 'Da Lat',
      address: '',
      pricePerHour: 150000,
      pricePerDay: 1200000,
      guests: 2,
      bedrooms: 1,
      beds: 1,
      baths: 1,
      description: '',
      amenitiesText: '',
      rulesText: '',
    })
    setRoomImages([])
    setImageUrlInput('')
    setEditingRoomId(null)
  }

  // Bookings state
  const [bookingsList, setBookingsList] = useState<BookingData[]>([])
  const [bookingToDelete, setBookingToDelete] = useState<BookingData | null>(null)
  const [deletingBooking, setDeletingBooking] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [refreshingBookings, setRefreshingBookings] = useState(false)

  // Edit booking state
  const [editingBooking, setEditingBooking] = useState<BookingData | null>(null)
  const [editBookingForm, setEditBookingForm] = useState<Partial<BookingData>>({})
  const [savingEdit, setSavingEdit] = useState(false)

  const refreshBookings = async () => {
    setRefreshingBookings(true)
    setBookingError('')
    try {
      setBookingsList(await getBookings())
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Không thể tải lịch đặt phòng.')
    } finally {
      setRefreshingBookings(false)
    }
  }

  const confirmDeleteBooking = async () => {
    if (!bookingToDelete || deletingBooking) return
    setDeletingBooking(true)
    setBookingError('')
    try {
      await deleteBooking(bookingToDelete.id || bookingToDelete.code)
      setBookingsList((previous) => {
        const index = previous.findIndex((booking) => bookingToDelete.id
          ? booking.id === bookingToDelete.id
          : !booking.id && booking.code === bookingToDelete.code)
        return previous.filter((_, bookingIndex) => bookingIndex !== index)
      })
      setBookingToDelete(null)
      setRoomActionToast({ message: 'Đã xoá đơn đặt phòng.', show: true })
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Không thể xoá đơn đặt phòng.')
    } finally {
      setDeletingBooking(false)
    }
  }

  const requestDeleteBooking = (booking: BookingData) => {
    setBookingError('')
    setBookingToDelete(booking)
  }

  const handleEditBooking = (booking: BookingData) => {
    setEditingBooking(booking)
    setEditBookingForm({
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      instagramNickname: booking.instagramNickname,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      specialRequests: booking.specialRequests ?? '',
      totalPrice: booking.totalPrice,
    })
  }

  const handleSaveEditBooking = async () => {
    if (!editingBooking || savingEdit) return
    setSavingEdit(true)
    try {
      const updated = await updateBooking(editingBooking.id || editingBooking.code, editBookingForm)
      setBookingsList((prev) =>
        prev.map((b) =>
          (b.id && b.id === updated.id) || b.code === updated.code ? { ...b, ...updated } : b
        )
      )
      setEditingBooking(null)
      setRoomActionToast({ message: 'Đã cập nhật đơn hàng thành công!', show: true })
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Không thể cập nhật đơn hàng.')
    } finally {
      setSavingEdit(false)
    }
  }

  // Payment settings state
  const [paymentConfig, setPaymentConfig] = useState<PaymentSettings>(defaultPaymentSettings)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [uploadingQr, setUploadingQr] = useState(false)

  // Authentication Guard
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = localStorage.getItem('studio_admin_auth')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.loggedIn) {
            setAuth(parsed)
            const [rooms, bookings, settings] = await Promise.all([
              getRooms(),
              getBookings(),
              getPaymentSettings().catch(() => defaultPaymentSettings),
            ])
            setRoomsList(rooms)
            setBookingsList(bookings)
            setPaymentConfig(settings)
            setCheckingAuth(false)
            return
          }
        }
      } catch {
        // ignore
      }

      setCheckingAuth(false)
      router.push('/admin/login')
    }

    void loadData()
  }, [router])

  const handleLogout = async () => {
    await logoutAdmin()
    localStorage.removeItem('studio_admin_auth')
    router.push('/admin/login')
  }

  // Handle changing booking status
  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    setBookingsList((prev) =>
      prev.map((b) => (b.id === bookingId || b.code === bookingId ? { ...b, status: newStatus } : b))
    )

    try {
      await updateBookingStatus(bookingId, newStatus)
    } catch (error) {
      console.error('Error while updating booking status in Firestore:', error)
    }
  }

  // ===== Real dashboard stats computed from bookingsList =====
  const PAID_STATUSES: BookingStatus[] = ['da_xac_nhan', 'dang_thue', 'da_hoan_thanh', 'deposit_paid']

  const dashboardStats = useMemo(() => {
    const paid = bookingsList.filter((b) => PAID_STATUSES.includes(b.status))
    const totalRevenue = paid.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0)

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const inRange = (b: BookingData, from: Date, to?: Date) => {
      const d = new Date(b.createdAt)
      if (Number.isNaN(d.getTime())) return false
      return to ? d >= from && d < to : d >= from
    }
    const monthRevenue = paid.filter((b) => inRange(b, monthStart)).reduce((s, b) => s + (Number(b.totalPrice) || 0), 0)
    const lastMonthRevenue = paid
      .filter((b) => inRange(b, lastMonthStart, monthStart))
      .reduce((s, b) => s + (Number(b.totalPrice) || 0), 0)
    const growthPercent =
      lastMonthRevenue > 0 ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : null

    // Daily revenue for the last 14 days (chart)
    const days: { label: string; value: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1)
      const value = paid
        .filter((b) => inRange(b, day, next))
        .reduce((s, b) => s + (Number(b.totalPrice) || 0), 0)
      days.push({ label: `${String(day.getDate()).padStart(2, '0')}/${String(day.getMonth() + 1).padStart(2, '0')}`, value })
    }

    return {
      totalRevenue,
      monthRevenue,
      growthPercent,
      totalCount: bookingsList.length,
      pendingCount: bookingsList.filter((b) => b.status === 'chua_xac_nhan' || b.status === 'pending').length,
      rentingCount: bookingsList.filter((b) => b.status === 'dang_thue').length,
      doneCount: bookingsList.filter((b) => b.status === 'da_hoan_thanh').length,
      chartDays: days,
    }
  }, [bookingsList])

  const [revenueRange, setRevenueRange] = useState<'month' | 'all'>('month')
  const displayedRevenue = revenueRange === 'month' ? dashboardStats.monthRevenue : dashboardStats.totalRevenue

  // Build a smooth SVG path from real daily revenue values
  const revenueChart = useMemo(() => {
    const values = dashboardStats.chartDays.map((d) => d.value)
    const max = Math.max(...values, 1)
    const W = 500
    const H = 150
    const step = values.length > 1 ? W / (values.length - 1) : W
    const points = values.map((v, i) => {
      const x = i * step
      const y = H - 12 - (v / max) * (H - 30)
      return { x, y }
    })
    let line = ''
    points.forEach((p, i) => {
      if (i === 0) {
        line += `M ${p.x.toFixed(1)},${p.y.toFixed(1)}`
      } else {
        const prev = points[i - 1]
        const cx = (prev.x + p.x) / 2
        line += ` C ${cx.toFixed(1)},${prev.y.toFixed(1)} ${cx.toFixed(1)},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`
      }
    })
    const area = `${line} L ${W},${H} L 0,${H} Z`
    return { line, area, points, labels: dashboardStats.chartDays.map((d) => d.label) }
  }, [dashboardStats])


  // Handle Add Room submit
  const handleAddRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const displayName = (newRoom.name || 'Studio').trim()
    const safeSlug = displayName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

    const roomId = editingRoomId ?? `${safeSlug || 'studio'}-${Date.now().toString().slice(-5)}`

    const amenities = (newRoom.amenitiesText || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const idx = line.indexOf(':')
        if (idx > -1) {
          const category = line.slice(0, idx).trim() || 'General'
          const items = line
            .slice(idx + 1)
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
          return { category, items }
        }
        return { category: 'General', items: [line] }
      })

    const rules = (newRoom.rulesText || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    const roomPayload: Studio = {
      id: roomId,
      name: displayName,
      type: newRoom.type.trim() || 'Photo Studio',
      city: newRoom.city.trim() || 'Hà Nội',
      address: newRoom.address.trim() || 'Địa chỉ studio',
      price: Number(newRoom.pricePerDay) || 0,
      pricePerDay: Number(newRoom.pricePerDay) || 0,
      pricePerHour: Number(newRoom.pricePerHour) || 0,
      rating: 5.0,
      reviewCount: 1,
      guests: Number(newRoom.guests) || 2,
      bedrooms: Number(newRoom.bedrooms) || 0,
      beds: Number(newRoom.beds) || 0,
      baths: Number(newRoom.baths) || 0,
      images: roomImages.length > 0 ? roomImages : [DEFAULT_STUDIO_IMAGE],
      tags: ['Studio', 'Chụp ảnh', 'Mới'],
      accent: '#f472b6',
      description: newRoom.description.trim() || 'Studio chụp ảnh hiện đại, phù hợp cho chụp ảnh theo giờ và theo ngày.',
      host: {
        name: auth?.username || 'Khanh',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        isSuperhost: true,
        responseRate: '100%',
        joinedYear: '2024',
      },
      amenities: amenities.length > 0 ? amenities : [{ category: 'General', items: ['Wi-Fi', 'Máy lạnh', 'Phòng thay đồ'] }],
      rules: rules.length > 0 ? rules : ['Check-in 14:00', 'Check-out 12:00', 'Không hút thuốc trong phòng'],
    }

    try {
      await saveRoom(roomPayload)

      setRoomsList((prev) => {
        if (editingRoomId) {
          return prev.map((room) => (room.id === editingRoomId ? roomPayload : room))
        }
        return [roomPayload, ...prev]
      })

      const successMessage = editingRoomId ? 'Phòng đã được chỉnh sửa thành công!' : 'Phòng đã được thêm thành công!'
      setRoomActionToast({ message: successMessage, show: true })
      setIsAddRoomOpen(false)
      resetRoomForm()
    } catch (error) {
      console.error('Error saving room to Firestore:', error)
    }
  }

  const handleEditRoom = (room: Studio) => {
    setEditingRoomId(room.id)
    const amenitiesText = room.amenities
      ?.map((item) => `${item.category}: ${item.items.join(', ')}`)
      .join('\n') ?? ''
    const rulesText = room.rules?.join('\n') ?? ''

    setNewRoom({
      name: room.name,
      type: room.type,
      city: room.city,
      address: room.address,
      pricePerHour: room.pricePerHour,
      pricePerDay: room.pricePerDay,
      guests: room.guests,
      bedrooms: room.bedrooms,
      beds: room.beds,
      baths: room.baths,
      description: room.description,
      amenitiesText,
      rulesText,
    })
    setRoomImages(room.images?.length ? room.images : [])
    setIsAddRoomOpen(true)
  }

  const handleDeleteRoom = (roomId: string) => {
    setDeleteRoomConfirm({ roomId, show: true })
  }

  const confirmDeleteRoom = async () => {
    if (!deleteRoomConfirm.roomId) return

    try {
      await deleteRoom(deleteRoomConfirm.roomId)
      setRoomsList((prev) => prev.filter((room) => room.id !== deleteRoomConfirm.roomId))
      setRoomActionToast({ message: 'Phòng đã được xoá thành công!', show: true })
    } catch (error) {
      console.error('Error deleting room from Firestore:', error)
    } finally {
      setDeleteRoomConfirm({ roomId: null, show: false })
    }
  }

  // Handle Payment Settings Save
  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSettings(true)
    try {
      const saved = await savePaymentSettings(paymentConfig)
      setPaymentConfig(saved)
      setSaveSuccessMsg('Đã lưu cấu hình thanh toán thành công!')
      setTimeout(() => setSaveSuccessMsg(''), 3000)
    } catch (error) {
      console.error('Error saving payment settings:', error)
      setSaveSuccessMsg('Lưu thất bại — vui lòng thử lại.')
      setTimeout(() => setSaveSuccessMsg(''), 3000)
    } finally {
      setSavingSettings(false)
    }
  }

  // Upload custom QR image (replaces auto-generated VietQR on checkout)
  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingQr(true)
    try {
      const [url] = await uploadImages(Array.from(files))
      setPaymentConfig((prev) => ({ ...prev, qrImageUrl: url }))
      setSaveSuccessMsg('Đã tải ảnh QR — nhớ bấm "Lưu cấu hình cài đặt" để áp dụng.')
      setTimeout(() => setSaveSuccessMsg(''), 4000)
    } catch (error) {
      console.error('Error uploading QR image:', error)
      setSaveSuccessMsg('Tải ảnh QR thất bại — vui lòng thử lại.')
      setTimeout(() => setSaveSuccessMsg(''), 3000)
    } finally {
      setUploadingQr(false)
      e.target.value = ''
    }
  }

  const handleRemoveQrImage = () => {
    setPaymentConfig((prev) => ({ ...prev, qrImageUrl: '' }))
    setSaveSuccessMsg('Đã bỏ ảnh QR tùy chỉnh — sẽ dùng VietQR tự sinh. Nhớ lưu để áp dụng.')
    setTimeout(() => setSaveSuccessMsg(''), 4000)
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3edf7] text-sm text-muted-foreground font-medium">
        Đang tải trang quản trị...
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#f3edf7] text-foreground p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Edit Booking Modal */}
        {editingBooking && (
          <div className="fixed inset-0 z-[1003] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <h2 className="font-serif text-xl font-bold text-slate-900">Chỉnh sửa đơn hàng</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground font-mono">{editingBooking.code} — {editingBooking.studioName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-4 overflow-y-auto px-6 py-5 max-h-[65vh] text-sm">
                {bookingError && (
                  <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">{bookingError}</p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-600">Họ và tên</label>
                    <input
                      type="text"
                      value={editBookingForm.customerName ?? ''}
                      onChange={(e) => setEditBookingForm((p) => ({ ...p, customerName: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-600">Số điện thoại</label>
                    <input
                      type="tel"
                      value={editBookingForm.customerPhone ?? ''}
                      onChange={(e) => setEditBookingForm((p) => ({ ...p, customerPhone: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm font-mono focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-600">Instagram</label>
                  <input
                    type="text"
                    value={editBookingForm.instagramNickname ?? ''}
                    onChange={(e) => setEditBookingForm((p) => ({ ...p, instagramNickname: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm focus:border-blue-400 focus:outline-none"
                    placeholder="@username"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-600">Check-in</label>
                    <input
                      type="text"
                      value={editBookingForm.checkIn ?? ''}
                      onChange={(e) => setEditBookingForm((p) => ({ ...p, checkIn: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm font-mono focus:border-blue-400 focus:outline-none"
                      placeholder="YYYY-MM-DD HH:mm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-600">Check-out</label>
                    <input
                      type="text"
                      value={editBookingForm.checkOut ?? ''}
                      onChange={(e) => setEditBookingForm((p) => ({ ...p, checkOut: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm font-mono focus:border-blue-400 focus:outline-none"
                      placeholder="YYYY-MM-DD HH:mm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-600">Số khách</label>
                    <input
                      type="number"
                      min={1}
                      value={editBookingForm.guests ?? 1}
                      onChange={(e) => setEditBookingForm((p) => ({ ...p, guests: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-600">Tổng tiền (VNĐ)</label>
                    <input
                      type="number"
                      min={0}
                      value={editBookingForm.totalPrice ?? 0}
                      onChange={(e) => setEditBookingForm((p) => ({ ...p, totalPrice: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm font-mono font-bold focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-600">Ghi chú</label>
                  <textarea
                    rows={2}
                    value={editBookingForm.specialRequests ?? ''}
                    onChange={(e) => setEditBookingForm((p) => ({ ...p, specialRequests: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm focus:border-blue-400 focus:outline-none"
                    placeholder="Ghi chú thêm..."
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => { setEditingBooking(null); setBookingError('') }}
                  disabled={savingEdit}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditBooking}
                  disabled={savingEdit}
                  className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {savingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          </div>
        )}

        {bookingToDelete && (
          <div className="fixed inset-0 z-[1002] flex items-center justify-center bg-black/40 p-4">
            <section role="alertdialog" aria-modal="true" aria-labelledby="delete-booking-title" aria-describedby="delete-booking-description" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"
              onKeyDown={(event) => {
                if (event.key === 'Escape' && !deletingBooking) setBookingToDelete(null)
                if (event.key === 'Tab') {
                  const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'))
                  const first = buttons[0]
                  const last = buttons[buttons.length - 1]
                  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
                  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
                }
              }}>
              <h2 id="delete-booking-title" className="text-lg font-bold text-rose-900">Xoá đơn {bookingToDelete.code}?</h2>
              <p id="delete-booking-description" className="mt-2 text-sm text-muted-foreground">Đơn của {bookingToDelete.customerName} tại {bookingToDelete.studioName} sẽ bị xoá vĩnh viễn khỏi lịch và thống kê doanh thu.</p>
              {bookingError && <p role="alert" className="mt-3 text-sm text-rose-700">{bookingError}</p>}
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" autoFocus disabled={deletingBooking} onClick={() => setBookingToDelete(null)} className="rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-50">Huỷ</button>
                <button type="button" disabled={deletingBooking} onClick={confirmDeleteBooking} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{deletingBooking ? 'Đang xoá...' : 'Xoá đơn'}</button>
              </div>
            </section>
          </div>
        )}
        {bookingError && !bookingToDelete && <p role="alert" className="rounded-xl border border-rose-200 bg-white p-4 text-sm text-rose-700">{bookingError}</p>}
        <div
          className={`fixed left-1/2 top-1/2 z-[1000] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-emerald-200 bg-white/95 px-4 py-3 shadow-[0_18px_45px_rgba(16,185,129,0.18)] backdrop-blur-xl transition-all duration-700 ease-out ${
            roomActionToast.show
              ? 'translate-y-0 opacity-100 scale-100'
              : '-translate-y-8 opacity-0 scale-95 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle size={16} />
            </div>
            <span className="text-sm font-bold text-emerald-900">{roomActionToast.message}</span>
          </div>
        </div>

        <div
          className={`fixed left-1/2 top-1/2 z-[1001] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-rose-200 bg-white/95 px-5 py-4 shadow-[0_18px_45px_rgba(244,63,94,0.18)] backdrop-blur-xl transition-all duration-500 ease-out ${
            deleteRoomConfirm.show
              ? 'translate-y-0 opacity-100 scale-100'
              : '-translate-y-8 opacity-0 scale-95 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <TriangleAlert size={22} />
            </div>
            <div className="space-y-3">
              <p className="text-base font-bold text-rose-900">Bạn có chắc chắn muốn xoá phòng không?</p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={confirmDeleteRoom}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700"
                >
                  Xoá
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteRoomConfirm({ roomId: null, show: false })}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                >
                  Huỷ
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Top Header Row */}
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/80 px-6 py-4 backdrop-blur shadow-sm border border-pink-200/60">
          <div className="flex items-center gap-3">
            <div className="brand-mark bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md">
              <Camera size={20} />
            </div>
            <div>
              <div className="font-serif text-xl font-bold bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">chupchoet.room Admin</div>
              <p className="text-xs text-muted-foreground font-medium">Studio Manager: {auth?.username || 'Khanh'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              <LogOut size={14} /> Đăng xuất
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-pink-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-pink-600 transition hover:bg-pink-50"
            >
              Xem trang Khách →
            </Link>
          </div>
        </header>

        {/* TOP SEGMENTED PILL TAB NAVIGATION BAR (Matching screenshot) */}
        <nav className="flex items-center justify-between gap-2 overflow-x-auto rounded-3xl bg-white/80 p-2 shadow-sm border border-white/60">
          <div className="flex flex-1 flex-wrap items-center justify-around gap-2 text-sm font-medium">
            {/* Tab 1: Quản lý (Analytics Dashboard - Active Default & First) */}
            <button
              onClick={() => setActiveTab('quanly')}
              className={`flex items-center gap-2 rounded-2xl px-6 py-3 transition ${activeTab === 'quanly'
                  ? 'bg-[#fbf5e8] font-bold text-emerald-950 shadow-sm border border-amber-200/60'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                }`}
            >
              <Settings size={18} className={activeTab === 'quanly' ? 'text-amber-600' : ''} />
              <span>Quản lý</span>
            </button>

            {/* Tab 2: Máy ảnh / Phòng */}
            <button
              onClick={() => setActiveTab('phong')}
              className={`flex items-center gap-2 rounded-2xl px-6 py-3 transition ${activeTab === 'phong'
                  ? 'bg-[#fbf5e8] font-bold text-emerald-950 shadow-sm border border-amber-200/60'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                }`}
            >
              <Camera size={18} className={activeTab === 'phong' ? 'text-amber-600' : ''} />
              <span>Phòng</span>
            </button>

            {/* Tab 3: Đơn hàng */}
            <button
              onClick={() => setActiveTab('donhang')}
              className={`flex items-center gap-2 rounded-2xl px-6 py-3 transition ${activeTab === 'donhang'
                  ? 'bg-[#fbf5e8] font-bold text-emerald-950 shadow-sm border border-amber-200/60'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                }`}
            >
              <Box size={18} className={activeTab === 'donhang' ? 'text-rose-600' : ''} />
              <span>Đơn hàng</span>
            </button>

            <button
              onClick={() => { setActiveTab('lich'); void refreshBookings() }}
              className={`flex items-center gap-2 rounded-2xl px-6 py-3 transition ${activeTab === 'lich' ? 'bg-[#fbf5e8] font-bold text-emerald-950 shadow-sm border border-amber-200/60' : 'text-muted-foreground hover:text-foreground hover:bg-white/50'}`}
            >
              <Calendar size={18} />
              <span>Lịch</span>
            </button>

            {/* Tab 4: Cài đặt */}
            <button
              onClick={() => setActiveTab('caidat')}
              className={`flex items-center gap-2 rounded-2xl px-6 py-3 transition ${activeTab === 'caidat'
                  ? 'bg-[#fbf5e8] font-bold text-emerald-950 shadow-sm border border-amber-200/60'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                }`}
            >
              <QrCode size={18} className={activeTab === 'caidat' ? 'text-rose-600' : ''} />
              <span>Cài đặt</span>
            </button>
          </div>
        </nav>

        {/* TAB CONTENT AREAS */}

        {/* =========================================================================
            TAB 3: QUẢN LÝ (DASHBOARD ANALYTICS - EXACT REPLICA OF REFERENCE SCREENSHOT)
           ========================================================================= */}
        {activeTab === 'lich' && <BookingCalendar bookings={bookingsList} rooms={roomsList} refreshing={refreshingBookings} onRefresh={refreshBookings} onDelete={requestDeleteBooking} />}

        {activeTab === 'quanly' && (
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            {/* Left Column: Revenue Analysis Chart Card */}
            <div className="rounded-3xl border border-white/60 bg-white p-6 md:p-8 shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-serif text-3xl font-bold text-emerald-950">Phân tích doanh thu</h2>
                    <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-emerald-600">
                      <TrendingUp size={16} />
                      {dashboardStats.growthPercent === null
                        ? 'Chưa có dữ liệu tháng trước để so sánh'
                        : `${dashboardStats.growthPercent >= 0 ? '+' : ''}${dashboardStats.growthPercent.toFixed(1)}% so với tháng trước`}
                    </p>
                  </div>

                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => setRevenueRange('month')}
                      className={`rounded-xl border px-3.5 py-1.5 font-medium transition ${revenueRange === 'month'
                          ? 'border-border bg-slate-50 text-foreground'
                          : 'border-border bg-white text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      Tháng này
                    </button>
                    <button
                      onClick={() => setRevenueRange('all')}
                      className={`rounded-xl border px-3.5 py-1.5 font-medium transition ${revenueRange === 'all'
                          ? 'border-border bg-slate-50 text-foreground'
                          : 'border-border bg-white text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      Tất cả
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">TỔNG THU NHẬP</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-serif text-4xl font-extrabold text-emerald-950">
                      {formatCurrency(displayedRevenue).replace(/\s?₫|\s?VNĐ/gi, '')}
                    </span>
                    <span className="text-sm font-bold text-muted-foreground">VNĐ</span>
                  </div>

                  <div className="mt-3">
                    <span className="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-border px-4 py-2 text-xs font-medium text-foreground">
                      Doanh thu từ đơn đã xác nhận / đang thuê / hoàn thành
                    </span>
                  </div>
                </div>
              </div>

              {/* Revenue Curve Line Graphic (real daily revenue, last 14 days) */}
              <div className="pt-6">
                <div className="relative h-48 w-full">
                  <svg className="h-full w-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Gradient Fill under curve */}
                    <path d={revenueChart.area} fill="url(#gradientRevenue)" />
                    {/* Glowing curve line */}
                    <path
                      d={revenueChart.line}
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    {/* Highlighted Data Point Dots */}
                    {revenueChart.points.map((p, i) =>
                      i % 3 === 0 ? (
                        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke="#6366f1" strokeWidth="2.5" />
                      ) : null
                    )}
                  </svg>
                </div>
                <div className="mt-4 flex justify-between text-[11px] font-medium text-muted-foreground px-2">
                  {revenueChart.labels
                    .filter((_, i) => i % 3 === 0)
                    .map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                </div>
              </div>
            </div>

            {/* Right Column: 4 Metric Cards Grid + Growth Report */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Metric 1: TỔNG ĐƠN */}
                <div className="rounded-3xl border border-white/60 bg-white p-5 shadow-sm space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-md">
                    <Box size={20} />
                  </div>
                  <div>
                    <div className="font-serif text-3xl font-bold text-emerald-950">{dashboardStats.totalCount}</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">TỔNG ĐƠN</div>
                  </div>
                </div>

                {/* Metric 2: CHỜ DUYỆT */}
                <div className="rounded-3xl border border-white/60 bg-white p-5 shadow-sm space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className="font-serif text-3xl font-bold text-emerald-950">{dashboardStats.pendingCount}</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">CHỜ DUYỆT</div>
                  </div>
                </div>

                {/* Metric 3: ĐANG THUÊ */}
                <div className="rounded-3xl border border-white/60 bg-white p-5 shadow-sm space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md">
                    <Camera size={20} />
                  </div>
                  <div>
                    <div className="font-serif text-3xl font-bold text-emerald-950">{dashboardStats.rentingCount}</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">ĐANG THUÊ</div>
                  </div>
                </div>

                {/* Metric 4: ĐÃ XONG */}
                <div className="rounded-3xl border border-white/60 bg-white p-5 shadow-sm space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <div className="font-serif text-3xl font-bold text-emerald-950">{dashboardStats.doneCount}</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">ĐÃ XONG</div>
                  </div>
                </div>
              </div>

              {/* Bottom Card: XEM BÁO CÁO TĂNG TRƯỞNG */}
              <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-sm text-center">
                <button className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-900 hover:text-rose-700 transition">
                  <TrendingUp size={16} /> XEM BÁO CÁO TĂNG TRƯỞNG
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 1: PHÒNG (ROOMS MANAGEMENT - HOURLY & DAILY PRICING)
           ========================================================================= */}
        {activeTab === 'phong' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-3xl bg-white p-6 shadow-sm border border-white/60">
              <div>
                <h2 className="font-serif text-3xl font-bold text-emerald-950">Danh sách Phòng & Giá cho thuê</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Quản lý giá thuê theo giờ, thuê theo ngày và chi tiết phòng.
                </p>
              </div>
              <button
                onClick={() => setIsAddRoomOpen(true)}
                className="primary-button cursor-pointer text-sm font-bold shadow-md"
              >
                <Plus size={18} /> Thêm phòng mới
              </button>
            </div>

            {/* Rooms Cards Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {roomsList.map((room) => (
                <div key={room.id} className="rounded-3xl bg-white border border-white/60 p-5 shadow-sm space-y-4">
                  <div className="relative aspect-[1.3] overflow-hidden rounded-2xl">
                    <img src={room.images?.[0] || DEFAULT_STUDIO_IMAGE} alt={room.name} className="h-full w-full object-cover" />
                    <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-emerald-950 backdrop-blur">
                      {room.type}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif text-2xl font-bold text-emerald-950">{room.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{room.address}</p>
                  </div>

                  {/* Dual Price Badge: Hourly vs Daily */}
                  <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-xs border border-border">
                    <div>
                      <span className="text-[10px] uppercase text-muted-foreground font-semibold">Theo giờ</span>
                      <div className="font-bold text-emerald-900 text-sm">{formatCurrency(room.pricePerHour || 150000)}/h</div>
                    </div>
                    <div className="border-l border-border pl-2">
                      <span className="text-[10px] uppercase text-muted-foreground font-semibold">Theo ngày</span>
                      <div className="font-bold text-amber-700 text-sm">{formatCurrency(room.pricePerDay || room.price)}/ngày</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleEditRoom(room)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                    >
                      <Edit size={14} /> Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRoom(room.id)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                    >
                      <Trash2 size={14} /> Xoá
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ADD ROOM / STUDIO POPUP MODAL */}
            {isAddRoomOpen && (
              <div
                className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setIsAddRoomOpen(false)
                    resetRoomForm()
                  }
                }}
              >
                <div
                  className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-100 bg-white shadow-2xl shadow-slate-900/20 animate-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-8">
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-slate-900 sm:text-3xl">
                        {editingRoomId ? 'Chỉnh sửa Studio' : 'Thêm Studio chụp ảnh mới'}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Nhập thông tin chi tiết và cài đặt giá cho thuê Studio.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddRoomOpen(false)
                        resetRoomForm()
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
                      aria-label="Đóng popup"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Modal Scrollable Form Body */}
                  <form
                    onSubmit={handleAddRoomSubmit}
                    className="flex flex-1 flex-col overflow-hidden"
                  >
                    <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5 sm:px-8 text-sm">
                      <div>
                        <label className="text-xs font-bold uppercase text-slate-700">Tên Studio *</label>
                        <input
                          required
                          type="text"
                          placeholder="VD: Studio Minimalist Pastel & Natural Light"
                          value={newRoom.name}
                          onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                          className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-semibold text-slate-900 focus:border-[#e11d48] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e11d48]/20"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase text-slate-700">Loại Studio / Concept</label>
                        <input
                          type="text"
                          placeholder="VD: Indoor Studio, Rooftop, Cyberpunk, Vintage Retro..."
                          value={newRoom.type}
                          onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
                          className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-semibold text-slate-900 focus:border-[#e11d48] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e11d48]/20"
                        />
                      </div>

                      {/* Prices */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
                        <div>
                          <label className="text-xs font-bold uppercase text-rose-800">Giá thuê theo Giờ (VNĐ) *</label>
                          <input
                            required
                            type="number"
                            value={newRoom.pricePerHour}
                            onChange={(e) => setNewRoom({ ...newRoom, pricePerHour: Number(e.target.value) })}
                            className="mt-1.5 w-full rounded-xl border border-rose-200 bg-white p-2.5 text-xs font-extrabold text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase text-slate-700">Giá thuê trọn Ngày (VNĐ) *</label>
                          <input
                            required
                            type="number"
                            value={newRoom.pricePerDay}
                            onChange={(e) => setNewRoom({ ...newRoom, pricePerDay: Number(e.target.value) })}
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-extrabold text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase text-slate-700">
                          Hình ảnh Studio (thêm được nhiều ảnh)
                        </label>
                        <div className="mt-1.5 space-y-3">
                          {roomImages.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {roomImages.map((img, idx) => (
                                <div
                                  key={`${img}-${idx}`}
                                  className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 shadow-xs"
                                >
                                  <img src={img} alt={`Ảnh ${idx + 1}`} className="h-full w-full object-cover" />
                                  {idx === 0 && (
                                    <span className="absolute left-1 top-1 rounded-full bg-[#e11d48] px-1.5 py-0.5 text-[9px] font-bold text-white">
                                      Ảnh chính
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeRoomImage(idx)}
                                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/30 p-5 text-center transition hover:border-rose-400 hover:bg-rose-50/60">
                            <Camera size={24} className="text-rose-500" />
                            <span className="text-xs font-bold text-slate-800">
                              {uploadingImages ? 'Đang tải ảnh lên...' : 'Chọn ảnh từ máy tính (chọn được nhiều ảnh)'}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                              JPG, PNG, WEBP — tối đa 5MB mỗi ảnh
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              disabled={uploadingImages}
                              onChange={handleImagesUpload}
                            />
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Hoặc dán link ảnh (https://...)"
                              value={imageUrlInput}
                              onChange={(e) => setImageUrlInput(e.target.value)}
                              className="flex-1 rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
                            />
                            <button
                              type="button"
                              onClick={addImageUrl}
                              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                            >
                              Thêm
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase text-slate-700">Giới thiệu về Studio</label>
                        <textarea
                          rows={3}
                          value={newRoom.description}
                          onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                          className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-semibold text-slate-900 focus:border-[#e11d48] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e11d48]/20"
                          placeholder="Mô tả không gian, phong cách, ánh sáng và trải nghiệm chụp ảnh..."
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase text-slate-700">Thiết bị & Tiện ích sẵn có</label>
                        <textarea
                          rows={3}
                          value={newRoom.amenitiesText}
                          onChange={(e) => setNewRoom({ ...newRoom, amenitiesText: e.target.value })}
                          className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-semibold text-slate-900 focus:border-[#e11d48] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e11d48]/20"
                          placeholder={'General: Wi-Fi, Máy lạnh, Phòng thay đồ\nLighting: Đèn LED, Softbox, Godox'}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase text-slate-700">Quy định sử dụng Studio</label>
                        <textarea
                          rows={3}
                          value={newRoom.rulesText}
                          onChange={(e) => setNewRoom({ ...newRoom, rulesText: e.target.value })}
                          className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-semibold text-slate-900 focus:border-[#e11d48] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e11d48]/20"
                          placeholder={'Check-in 14:00\nCheck-out 12:00\nKhông hút thuốc trong phòng'}
                        />
                      </div>
                    </div>

                    {/* Modal Sticky Footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 sm:px-8">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddRoomOpen(false)
                          resetRoomForm()
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                      >
                        Huỷ
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl bg-[#e11d48] px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#be123c] cursor-pointer"
                      >
                        {editingRoomId ? 'Cập nhật Studio' : 'Lưu Studio mới'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: ĐƠN HÀNG (ORDERS MANAGEMENT - STATUS SELECTION IN RIGHT COLUMN)
           ========================================================================= */}
        {activeTab === 'donhang' && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-white/60">
              <h2 className="font-serif text-3xl font-bold text-emerald-950">Quản lý Đơn hàng & Đặt phòng</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Theo dõi khách hàng, lịch thuê phòng và cập nhật trạng thái đơn hàng ở góc bên phải.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm border border-white/60 overflow-x-auto space-y-4">
              <div className="divide-y divide-border">
                {bookingsList.length === 0 && <p className="py-5 text-sm text-muted-foreground">Chưa có đơn đặt phòng.</p>}
                {bookingsList.map((booking, idx) => (
                  <div key={`${booking.id || booking.code}-${idx}`} className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Room & Customer details */}
                    <div className="flex items-start gap-4">
                      <img src={booking.studioImage} alt={booking.studioName} className="h-16 w-20 rounded-xl object-cover" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                            {booking.code}
                          </span>
                          <span className="text-xs font-medium text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                            {booking.rentalType === 'hourly' ? 'Thuê theo giờ' : 'Thuê theo ngày'}
                          </span>
                        </div>

                        <h3 className="font-serif text-xl font-bold text-emerald-950">{booking.studioName}</h3>
                        <p className="text-xs text-foreground font-semibold">
                          Khách hàng: {booking.customerName} ({booking.customerPhone})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Lịch thuê: {booking.checkIn} — {booking.checkOut} ({booking.guests} khách)
                        </p>
                      </div>
                    </div>

                    {/* Right: Total Price & Interactive Status Dropdown Selector */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-border">
                      <div className="text-left md:text-right">
                        <div className="text-xs text-muted-foreground">Tổng tiền</div>
                        <div className="font-serif text-lg font-bold text-emerald-950">{formatCurrency(booking.totalPrice)}</div>
                      </div>

                      {/* Interactive Right-side Status Selector */}
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground hidden sm:inline">Trạng thái:</label>
                        <select
                          value={booking.status}
                          onChange={(e) => handleStatusChange(booking.id || booking.code, e.target.value as BookingStatus)}
                          className={`rounded-xl px-3.5 py-2 text-xs font-bold border outline-none cursor-pointer transition ${booking.status === 'chua_xac_nhan' || booking.status === 'pending'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : booking.status === 'da_xac_nhan' || booking.status === 'confirmed' || booking.status === 'deposit_paid'
                                ? 'bg-blue-100 text-blue-900 border-blue-300'
                                : booking.status === 'dang_thue'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : 'bg-rose-100 text-rose-900 border-rose-200'
                            }`}
                        >
                          <option value="chua_xac_nhan">🟠 Chưa xác nhận</option>
                          <option value="da_xac_nhan">🔵 Đã xác nhận</option>
                          <option value="dang_thue">🟢 Đang thuê</option>
                          <option value="da_hoan_thanh">⬛ Đã hoàn thành</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleEditBooking(booking)}
                          aria-label={`Chỉnh sửa đơn ${booking.code}`}
                          className="rounded-xl border border-blue-200 p-2 text-blue-700 hover:bg-blue-50 transition"
                          title="Chỉnh sửa đơn hàng"
                        >
                          <Edit size={17} />
                        </button>
                        <button type="button" onClick={() => requestDeleteBooking(booking)} aria-label={`Xoá đơn ${booking.code}`} className="rounded-xl border border-rose-200 p-2 text-rose-700 hover:bg-rose-50 transition">
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: CÀI ĐẶT (SETTINGS - PAYMENT & VIETQR CONFIGURATION)
           ========================================================================= */}
        {activeTab === 'caidat' && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column: Form Settings */}
            <div className="rounded-3xl bg-white p-6 md:p-8 shadow-sm border border-white/60 space-y-6">
              <div>
                <h2 className="font-serif text-3xl font-bold text-emerald-950">Cài đặt Thanh toán & VietQR</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cấu hình tài khoản ngân hàng nhận tiền cọc tự động từ khách hàng.
                </p>
              </div>

              {saveSuccessMsg && (
                <div className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-900 border border-emerald-200">
                  ✓ {saveSuccessMsg}
                </div>
              )}

              <form onSubmit={handleSavePaymentConfig} className="space-y-4 text-sm">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Tên Ngân Hàng</label>
                  <input
                    required
                    type="text"
                    value={paymentConfig.bankName}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, bankName: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-border p-3 text-sm focus:outline-emerald-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Số Tài Khoản</label>
                  <input
                    required
                    type="text"
                    value={paymentConfig.accountNumber}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, accountNumber: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-border p-3 text-sm focus:outline-emerald-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Tên Chủ Tài Khoản</label>
                  <input
                    required
                    type="text"
                    value={paymentConfig.accountHolder}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, accountHolder: e.target.value.toUpperCase() })}
                    className="mt-1.5 w-full rounded-xl border border-border p-3 text-sm focus:outline-emerald-800 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Phần trăm Đặt cọc (% Total)</label>
                  <input
                    required
                    type="number"
                    min="10"
                    max="100"
                    value={paymentConfig.depositPercent}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, depositPercent: Number(e.target.value) })}
                    className="mt-1.5 w-full rounded-xl border border-border p-3 text-sm focus:outline-emerald-800 font-bold"
                  />
                </div>

                <button type="submit" className="primary-button w-full justify-center py-3.5 mt-4">
                  Lưu cấu hình cài đặt
                </button>
              </form>
            </div>

            {/* Right Column: QR Preview (uploaded image or auto VietQR) */}
            <div className="rounded-3xl bg-white p-6 md:p-8 shadow-sm border border-white/60 flex flex-col justify-between space-y-6">
              <div>
                <h3 className="font-serif text-2xl font-bold text-emerald-950">Ảnh QR nhận tiền</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tải ảnh QR của bạn (chụp màn hình app ngân hàng) — khách sẽ quét ảnh này thay vì VietQR tự sinh.
                </p>

                <div className="mt-6 flex flex-col items-center rounded-2xl bg-amber-50/50 p-6 border border-amber-200">
                  {paymentConfig.qrImageUrl ? (
                    <div className="h-44 w-44 overflow-hidden rounded-2xl bg-white p-2 shadow-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={paymentConfig.qrImageUrl} alt="Ảnh QR thanh toán" className="h-full w-full object-contain" />
                    </div>
                  ) : (
                    <div className="flex h-44 w-44 items-center justify-center rounded-2xl bg-emerald-950 text-amber-400 font-mono text-center p-4 shadow-md">
                      <div>
                        <div className="font-bold text-xl">VietQR</div>
                        <div className="mt-1 text-xs text-white uppercase">{paymentConfig.bankName.split(' ')[0]}</div>
                        <div className="mt-2 text-xs text-amber-300 font-bold">{paymentConfig.depositPercent}% DEPOSIT</div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2">
                    <input
                      id="qr-image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleQrUpload}
                      disabled={uploadingQr}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('qr-image-upload')?.click()}
                      disabled={uploadingQr}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-950 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-900 disabled:opacity-60"
                    >
                      <Upload size={14} /> {uploadingQr ? 'Đang tải ảnh...' : 'Tải ảnh QR'}
                    </button>
                    {paymentConfig.qrImageUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveQrImage}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                      >
                        <Trash2 size={14} /> Dùng VietQR tự sinh
                      </button>
                    )}
                  </div>

                  <div className="mt-4 text-center space-y-1 text-xs">
                    <div className="font-bold text-emerald-950 text-sm">{paymentConfig.accountHolder}</div>
                    <div className="font-mono font-semibold text-muted-foreground">{paymentConfig.accountNumber}</div>
                    <div className="text-muted-foreground">{paymentConfig.bankName}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
