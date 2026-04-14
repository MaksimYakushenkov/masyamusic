import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { PlayerBar } from '@/components/player/PlayerBar'
import { AudioEngine } from '@/components/player/AudioEngine'

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — hidden on mobile */}
        <div className="hidden md:flex h-full flex-col" style={{
          width: 'var(--sidebar-width)',
          flexShrink: 0,
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border)',
        }}>
          <Sidebar />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-main)' }}>
          {children}
        </main>
      </div>

      {/* Player bar */}
      <PlayerBar />

      {/* Mobile bottom nav */}
      <MobileNav />

      <AudioEngine />
    </div>
  )
}
