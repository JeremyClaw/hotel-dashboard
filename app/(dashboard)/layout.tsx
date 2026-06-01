import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side auth check — no Edge Runtime needed
  const cookieStore = await cookies()
  const session = cookieStore.get('hotel_session')?.value
  const secret = process.env.SESSION_SECRET

  if (!secret || !session || session !== secret) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-[#0b1120]">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
