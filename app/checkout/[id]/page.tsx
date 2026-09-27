'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

// Legacy checkout route — now a redirect stub into the unified /booking wizard.
export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()

  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    query.set('studioId', resolvedParams.id)
    router.replace(`/booking?${query.toString()}`)
  }, [resolvedParams.id, router])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 grid place-items-center">
        <p className="muted">Đang chuyển tới trang đặt lịch…</p>
      </main>
      <Footer />
    </div>
  )
}
