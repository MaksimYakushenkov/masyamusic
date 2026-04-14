'use client'

import { useState, useEffect, useCallback } from 'react'
import { MagnifyingGlassIcon, ArrowUpTrayIcon, ListBulletIcon, BookmarkSquareIcon } from '@heroicons/react/24/outline'
import { TrackItem } from '@/components/ui/TrackItem'
import { AddToPlaylistModal } from '@/components/ui/AddToPlaylistModal'
import { ImportModal } from '@/components/ui/ImportModal'
import { PlayerTrack } from '@/store/player'
import { useSearchParams } from 'next/navigation'

interface LibraryTrack extends PlayerTrack {
  id: number
  duration?: number
  liked: boolean
  source: string
}

export default function LibraryPage() {
  const [tracks, setTracks] = useState<LibraryTrack[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState<PlayerTrack | null>(null)
  const searchParams = useSearchParams()
  const filterLiked = searchParams.get('filter') === 'liked'

  const fetchTracks = useCallback(async (q = '') => {
    setLoading(true)
    const res = await fetch(`/api/tracks${q ? `?q=${encodeURIComponent(q)}` : ''}`)
    const data = await res.json()
    let list = data.tracks || []
    if (filterLiked) list = list.filter((t: LibraryTrack) => t.liked)
    setTracks(list)
    setLoading(false)
  }, [filterLiked])

  useEffect(() => { fetchTracks() }, [fetchTracks])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setQuery(v)
    fetchTracks(v)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      await fetch('/api/tracks', { method: 'POST', body: fd })
    }
    setUploading(false)
    fetchTracks(query)
    e.target.value = ''
  }

  const handleLike = async (track: PlayerTrack & { downloadUrl?: string }) => {
    const lt = track as LibraryTrack
    if (!lt.liked) {
      await fetch('/api/tracks/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: track.title, artist: track.artist, coverUrl: track.coverUrl, downloadUrl: track.filePath }),
      })
    } else {
      await fetch('/api/tracks/like', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: lt.id }),
      })
    }
    setTracks((prev) => prev.map((t) => (t.id === lt.id ? { ...t, liked: !t.liked } : t)))
  }

  const playerQueue: PlayerTrack[] = tracks.map((t) => ({
    id: t.id, title: t.title, artist: t.artist, coverUrl: t.coverUrl, filePath: t.filePath, liked: t.liked,
  }))

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-black uppercase tracking-widest text-white" style={{ fontFamily: 'var(--font)' }}>
          {filterLiked ? 'Любимые' : 'Библиотека'}
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all hover:border-white/20"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <ListBulletIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Импорт из списка</span>
            <span className="sm:hidden">Импорт</span>
          </button>

          <label
            className={`btn-accent flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{uploading ? 'Загрузка...' : 'Загрузить'}</span>
            <input type="file" accept="audio/*" multiple className="hidden" onChange={handleUpload} />
          </label>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <MagnifyingGlassIcon
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Поиск в библиотеке..."
          className="input-styled w-full pl-11 pr-4 py-3 rounded-xl"
        />
      </div>

      {/* States */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(255,65,0,0.2)', borderTopColor: 'var(--accent)' }} />
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(255,65,0,0.06)', border: '1px solid rgba(255,65,0,0.1)' }}>
            <BookmarkSquareIcon className="w-8 h-8" style={{ color: 'rgba(255,65,0,0.4)' }} />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-white">
            {filterLiked ? 'Нет любимых треков' : 'Библиотека пуста'}
          </p>
          <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {filterLiked ? 'Лайкайте треки в поиске' : 'Загрузите треки или найдите через поиск'}
          </p>
        </div>
      ) : (
        <div>
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
                onLike={handleLike}
                onAddToPlaylist={(t) => setAddToPlaylistTrack(t)}
              />
            ))}
          </div>
        </div>
      )}

      <AddToPlaylistModal track={addToPlaylistTrack} onClose={() => setAddToPlaylistTrack(null)} />
      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onDone={() => fetchTracks(query)} />
      )}
    </div>
  )
}
