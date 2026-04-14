'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TrackItem } from '@/components/ui/TrackItem'
import { PlayerTrack, usePlayerStore } from '@/store/player'
import { PlayIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/solid'

interface PlaylistTrack extends PlayerTrack {
  id: number
  duration?: number
  liked: boolean
  position: number
}

interface Playlist {
  id: number
  name: string
}

export default function PlaylistPage() {
  const params = useParams()
  const router = useRouter()
  const { setQueue } = usePlayerStore()
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [tracks, setTracks] = useState<PlaylistTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    fetch(`/api/playlists/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setPlaylist(d.playlist)
        setNewName(d.playlist?.name || '')
        setTracks(d.tracks || [])
        setLoading(false)
      })
  }, [params.id])

  const handleRename = async () => {
    if (!newName.trim()) return
    await fetch(`/api/playlists/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    })
    setPlaylist((p) => p ? { ...p, name: newName } : p)
    setEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm('Удалить плейлист?')) return
    await fetch(`/api/playlists/${params.id}`, { method: 'DELETE' })
    router.push('/')
  }

  const removeTrack = async (trackId: number) => {
    await fetch(`/api/playlists/${params.id}/tracks`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId }),
    })
    setTracks((t) => t.filter((tr) => tr.id !== trackId))
  }

  const playerQueue: PlayerTrack[] = tracks.map((t) => ({
    id: t.id, title: t.title, artist: t.artist, coverUrl: t.coverUrl, filePath: t.filePath, liked: t.liked,
  }))

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(255,65,0,0.2)', borderTopColor: 'var(--accent)' }} />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div
        className="px-6 pt-10 pb-8 flex flex-wrap items-end gap-6"
        style={{ background: 'linear-gradient(to bottom, rgba(255,65,0,0.15), transparent)' }}
      >
        <div
          className="w-40 h-40 rounded-2xl flex items-center justify-center text-5xl shadow-2xl flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(255,65,0,0.3) 0%, rgba(100,0,200,0.3) 100%)',
            border: '1px solid rgba(255,65,0,0.2)',
            boxShadow: '0 8px 40px rgba(255,65,0,0.15)',
          }}
        >
          ♪
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase font-bold tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
            Плейлист
          </p>
          {editing ? (
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              className="input-styled text-3xl font-black tracking-wide bg-transparent rounded-lg px-2 py-1 w-full"
              style={{ borderColor: 'var(--border-accent)' }}
            />
          ) : (
            <h1
              className="text-3xl font-black uppercase tracking-wide text-white cursor-pointer hover:opacity-80 transition-opacity truncate"
              style={{ fontFamily: 'var(--font)' }}
              onClick={() => setEditing(true)}
            >
              {playlist?.name}
            </h1>
          )}
          <p className="mt-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {tracks.length} {tracks.length === 1 ? 'трек' : tracks.length < 5 ? 'трека' : 'треков'}
          </p>

          <div className="flex items-center gap-3 mt-5">
            {tracks.length > 0 && (
              <button
                onClick={() => setQueue(playerQueue, 0)}
                className="btn-accent w-12 h-12 rounded-full flex items-center justify-center"
              >
                <PlayIcon className="w-5 h-5 text-white ml-0.5" />
              </button>
            )}
            <button
              onClick={() => setEditing(true)}
              className="transition-colors hover:text-white"
              style={{ color: 'var(--text-muted)' }}
              title="Переименовать"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="transition-colors hover:text-red-400"
              style={{ color: 'var(--text-muted)' }}
              title="Удалить"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="px-6 pb-8">
        {tracks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm font-bold uppercase tracking-widest text-white">Плейлист пуст</p>
            <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              Добавляйте треки через кнопку ⋯ в библиотеке
            </p>
          </div>
        ) : (
          <>
            <div
              className="grid text-[10px] font-bold uppercase tracking-widest px-3 mb-2"
              style={{ gridTemplateColumns: '20px 36px 1fr auto auto', gap: '1rem', color: 'var(--text-subtle)' }}
            >
              <span>#</span><span /><span>Трек</span><span /><span />
            </div>
            <div className="space-y-0.5">
              {tracks.map((track, i) => (
                <TrackItem
                  key={track.id}
                  track={track}
                  index={i}
                  queue={playerQueue}
                  onAddToPlaylist={() => removeTrack(track.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
