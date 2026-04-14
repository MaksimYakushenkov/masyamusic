'use client'

import { useState } from 'react'
import { usePlayerStore, PlayerTrack } from '@/store/player'
import {
  PlayIcon, PauseIcon, HeartIcon, ArrowDownTrayIcon, EllipsisHorizontalIcon,
} from '@heroicons/react/24/solid'
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline'

interface TrackItemProps {
  track: PlayerTrack & { downloadUrl?: string; liked?: boolean; duration?: number }
  index: number
  queue: PlayerTrack[]
  onLike?: (track: PlayerTrack & { downloadUrl?: string }) => void
  onAddToPlaylist?: (track: PlayerTrack) => void
  showDownload?: boolean
}

export function TrackItem({ track, index, queue, onLike, onAddToPlaylist, showDownload }: TrackItemProps) {
  const { currentIndex, isPlaying, queue: playerQueue, setQueue, togglePlay } = usePlayerStore()
  const [liking, setLiking] = useState(false)

  const isCurrentTrack = playerQueue[currentIndex]?.filePath === track.filePath
  const isThisPlaying = isCurrentTrack && isPlaying

  const handlePlay = () => {
    if (isCurrentTrack) togglePlay()
    else setQueue(queue, index)
  }

  const handleLike = async () => {
    if (liking || !onLike) return
    setLiking(true)
    try { await onLike(track) } finally { setLiking(false) }
  }

  const fmt = (s?: number | null) => {
    if (!s) return ''
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div
      onClick={handlePlay}
      className={`track-row grid items-center gap-4 px-3 py-2.5 rounded-lg cursor-pointer${isCurrentTrack ? ' track-row--current' : ''}`}
      style={{ gridTemplateColumns: '20px 36px 1fr auto auto' }}
    >
      {/* Index / play — toggled via CSS in globals.css */}
      <div className="flex items-center justify-center w-5">
        <span
          className="track-index text-xs tabular-nums font-medium"
          style={{ color: isCurrentTrack ? 'var(--accent)' : 'var(--text-muted)' }}
        >
          {index + 1}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); handlePlay() }}
          className="track-play items-center justify-center hover:scale-110 transition-transform"
        >
          {isThisPlaying
            ? <PauseIcon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            : <PlayIcon className="w-4 h-4 text-white" />
          }
        </button>
      </div>

      {/* Cover */}
      <div
        className="w-9 h-9 rounded-md overflow-hidden flex-shrink-0"
        style={{ border: '1px solid var(--border)' }}
      >
        {track.coverUrl ? (
          <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-sm"
            style={{ background: 'rgba(255,65,0,0.08)', color: 'rgba(255,65,0,0.5)' }}
          >
            ♪
          </div>
        )}
      </div>

      {/* Title + artist */}
      <div className="min-w-0" onClick={(e) => e.stopPropagation()}>
        <p
          className="text-xs font-semibold truncate"
          style={{ color: isCurrentTrack ? 'var(--accent)' : 'var(--text)', letterSpacing: '0.01em' }}
        >
          {track.title}
        </p>
        <p className="text-xs truncate mt-0.5 font-normal" style={{ color: 'var(--text-muted)' }}>
          {track.artist}
        </p>
      </div>

      {/* Actions — shown on hover via CSS .track-actions */}
      <div
        className="track-actions flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {onLike && (
          <button onClick={handleLike} disabled={liking} className="hover:scale-110 transition-transform">
            {track.liked
              ? <HeartIcon className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              : <HeartOutlineIcon className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            }
          </button>
        )}
        {showDownload && track.downloadUrl && (
          <a
            href={track.downloadUrl}
            download
            className="transition-colors hover:text-white"
            style={{ color: 'var(--text-muted)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
          </a>
        )}
        {onAddToPlaylist && (
          <button
            onClick={() => onAddToPlaylist(track)}
            className="transition-colors hover:text-white"
            style={{ color: 'var(--text-muted)' }}
          >
            <EllipsisHorizontalIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Duration */}
      <span className="text-[10px] w-8 text-right tabular-nums" style={{ color: 'var(--text-subtle)' }}>
        {fmt(track.duration)}
      </span>
    </div>
  )
}
