'use client'

import { useState, useCallback, useRef } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { TrackItem } from '@/components/ui/TrackItem'
import { AddToPlaylistModal } from '@/components/ui/AddToPlaylistModal'
import { PlayerTrack } from '@/store/player'

interface SearchTrack extends PlayerTrack {
  downloadUrl: string
  liked: boolean
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState<PlayerTrack | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResults(
        (data.tracks as Array<{ title: string; artist: string; coverUrl: string; downloadUrl: string }>).map((t) => ({
          title: t.title, artist: t.artist, coverUrl: t.coverUrl,
          filePath: t.downloadUrl, downloadUrl: t.downloadUrl, liked: false,
        }))
      )
      setSearched(true)
    } catch {
      setError('Ошибка поиска. Проверьте подключение.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setQuery(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(v), 600)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    search(query)
  }

  const handleLike = async (track: SearchTrack) => {
    const res = await fetch('/api/tracks/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: track.title, artist: track.artist, coverUrl: track.coverUrl, downloadUrl: track.downloadUrl }),
    })
    if (res.ok) {
      setResults((prev) => prev.map((t) => (t.filePath === track.filePath ? { ...t, liked: !t.liked } : t)))
    }
  }

  const playerQueue: PlayerTrack[] = results.map((t) => ({
    title: t.title, artist: t.artist, coverUrl: t.coverUrl, filePath: t.filePath, liked: t.liked,
  }))

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <h1
        className="text-2xl font-black uppercase tracking-widest text-white mb-6"
        style={{ fontFamily: 'var(--font)' }}
      >
        Поиск
      </h1>

      {/* Search input */}
      <form onSubmit={handleSubmit} className="relative mb-8">
        <MagnifyingGlassIcon
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          value={query}
          onChange={handleInput}
          placeholder="Исполнитель, трек..."
          autoFocus
          className="input-styled w-full pl-11 pr-11 py-4 rounded-2xl"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults([]); setSearched(false) }}
            className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:text-white"
            style={{ color: 'var(--text-muted)' }}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* States */}
      {loading && (
        <div className="flex justify-center py-20">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(255,65,0,0.2)', borderTopColor: 'var(--accent)' }}
          />
        </div>
      )}

      {error && (
        <div className="text-center py-20">
          <p className="text-sm font-medium" style={{ color: '#ff8c6b' }}>{error}</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-20">
          <p className="text-base font-bold text-white uppercase tracking-widest">Ничего не найдено</p>
          <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>Попробуйте другой запрос</p>
        </div>
      )}

      {!loading && !searched && !query && (
        <div className="text-center py-20">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(255,65,0,0.06)', border: '1px solid rgba(255,65,0,0.1)' }}
          >
            <MagnifyingGlassIcon className="w-8 h-8" style={{ color: 'rgba(255,65,0,0.4)' }} />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-white">Найдите свою музыку</p>
          <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>Введите название трека или исполнителя</p>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div>
          <div
            className="grid text-[10px] font-bold uppercase tracking-widest px-3 mb-2"
            style={{ gridTemplateColumns: '20px 36px 1fr auto auto', gap: '1rem', color: 'var(--text-subtle)' }}
          >
            <span>#</span><span /><span>Трек</span><span /><span />
          </div>
          <div className="space-y-0.5">
            {results.map((track, i) => (
              <TrackItem
                key={`${track.filePath}-${i}`}
                track={track}
                index={i}
                queue={playerQueue}
                onLike={handleLike as (track: PlayerTrack & { downloadUrl?: string }) => void}
                onAddToPlaylist={(t) => setAddToPlaylistTrack(t)}
                showDownload
              />
            ))}
          </div>
        </div>
      )}

      <AddToPlaylistModal track={addToPlaylistTrack} onClose={() => setAddToPlaylistTrack(null)} />
    </div>
  )
}
