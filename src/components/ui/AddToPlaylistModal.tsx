'use client'

import { useEffect, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { PlayerTrack } from '@/store/player'

interface Playlist { id: number; name: string }

interface AddToPlaylistModalProps {
  track: PlayerTrack | null
  onClose: () => void
}

export function AddToPlaylistModal({ track, onClose }: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [adding, setAdding] = useState<number | null>(null)
  const [done, setDone] = useState<number[]>([])

  useEffect(() => {
    if (track) {
      fetch('/api/playlists').then((r) => r.json()).then((d) => setPlaylists(d.playlists || []))
      setDone([])
    }
  }, [track])

  if (!track) return null

  const addToPlaylist = async (playlistId: number) => {
    if (!track.id) return
    setAdding(playlistId)
    await fetch(`/api/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId: track.id }),
    })
    setDone((d) => [...d, playlistId])
    setAdding(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="rounded-2xl p-6 w-80 shadow-2xl"
        style={{
          background: 'rgba(24,24,24,0.96)',
          border: '1px solid var(--border)',
          boxShadow: '0 0 40px rgba(0,0,0,0.6)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: 'var(--font)' }}>
            Добавить в плейлист
          </h3>
          <button onClick={onClose} className="transition-colors hover:text-white" style={{ color: 'var(--text-muted)' }}>
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs mb-4 truncate font-medium" style={{ color: 'var(--text-muted)' }}>
          {track.title} — {track.artist}
        </p>

        {playlists.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>Нет плейлистов. Создайте в сайдбаре.</p>
        ) : (
          <div className="space-y-0.5 max-h-60 overflow-y-auto">
            {playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => addToPlaylist(pl.id)}
                disabled={adding === pl.id || done.includes(pl.id)}
                className={`playlist-option w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium${done.includes(pl.id) ? ' playlist-option--done' : ''}`}
              >
                {done.includes(pl.id) ? '✓ ' : ''}{pl.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
