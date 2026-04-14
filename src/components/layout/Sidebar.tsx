'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  MagnifyingGlassIcon,
  BookmarkSquareIcon,
  PlusIcon,
  HeartIcon,
  ArrowRightOnRectangleIcon,
  MusicalNoteIcon,
} from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'

interface SidebarPlaylist {
  id: number
  name: string
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [playlists, setPlaylists] = useState<SidebarPlaylist[]>([])
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (session) {
      fetch('/api/playlists')
        .then((r) => r.json())
        .then((d) => setPlaylists(d.playlists || []))
    }
  }, [session])

  const createPlaylist = async () => {
    if (!newName.trim()) return
    const res = await fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    })
    const data = await res.json()
    setPlaylists((p) => [...p, data.playlist])
    setNewName('')
    setCreating(false)
  }

  const navItem = (href: string, label: string, Icon: React.ElementType) => {
    const active = pathname === href || pathname.startsWith(href + '/')
    return (
      <Link
        href={href}
        className={`nav-item relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium border-l-2${active ? ' nav-item--active' : ''}`}
        style={{ borderLeftColor: 'transparent' }}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="tracking-wide text-xs uppercase font-semibold">{label}</span>
        {active && (
          <span
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{ boxShadow: 'inset 0 0 20px rgba(255,65,0,0.06)' }}
          />
        )}
      </Link>
    )
  }

  return (
    <aside className="flex flex-col h-full overflow-hidden w-full">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--accent)', boxShadow: '0 0 16px var(--accent-glow)' }}
          >
            <MusicalNoteIcon className="w-4 h-4 text-white" />
          </div>
          <span
            className="font-black text-sm tracking-widest uppercase text-white"
            style={{ fontFamily: 'var(--font)' }}
          >
            Masya<span style={{ color: 'var(--accent)' }}>Music</span>
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 space-y-0.5">
        {navItem('/search', 'Поиск', MagnifyingGlassIcon)}
        {navItem('/library', 'Библиотека', BookmarkSquareIcon)}
      </nav>

      <div className="my-4 mx-3" style={{ borderTop: '1px solid var(--border)' }} />

      {/* Playlists */}
      <div className="px-3 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-1 mb-3">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--text-subtle)' }}
          >
            Плейлисты
          </span>
          <button
            onClick={() => setCreating(true)}
            className="w-6 h-6 rounded flex items-center justify-center transition-all hover:scale-110"
            style={{ color: 'var(--text-muted)' }}
            title="Новый плейлист"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>

        {creating && (
          <div className="mb-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') createPlaylist()
                if (e.key === 'Escape') setCreating(false)
              }}
              placeholder="Название..."
              className="w-full px-3 py-2 text-xs rounded-lg text-white placeholder-gray-600 outline-none"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-accent)',
                fontFamily: 'var(--font)',
              }}
            />
          </div>
        )}

        {/* Liked */}
        <Link
          href="/library?filter=liked"
          className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs transition-all hover:bg-white/5 mb-1"
          style={{ color: pathname.includes('liked') ? 'var(--accent)' : 'var(--text-muted)' }}
        >
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #450af5 0%, #FF4100 100%)' }}
          >
            <HeartIcon className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold tracking-wide uppercase truncate">Любимые</span>
        </Link>

        {playlists.map((pl) => (
          <Link
            key={pl.id}
            href={`/playlists/${pl.id}`}
            className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs transition-all hover:bg-white/5 truncate"
            style={{
              color: pathname === `/playlists/${pl.id}` ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-xs flex-shrink-0"
              style={{ background: 'rgba(255,65,0,0.1)', border: '1px solid rgba(255,65,0,0.2)' }}
            >
              ♪
            </div>
            <span className="font-medium truncate">{pl.name}</span>
          </Link>
        ))}
      </div>

      {/* User */}
      {session && (
        <div
          className="p-4 flex items-center justify-between gap-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, var(--accent), #ff8c00)',
                boxShadow: '0 0 12px var(--accent-glow)',
              }}
            >
              {session.user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="text-xs font-semibold text-white truncate">{session.user?.name}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex-shrink-0 transition-colors hover:text-white"
            style={{ color: 'var(--text-subtle)' }}
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  )
}
