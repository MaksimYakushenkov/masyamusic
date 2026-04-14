'use client'

import { usePlayerStore } from '@/store/player'
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsRightLeftIcon,
  ArrowPathIcon,
  HeartIcon,
} from '@heroicons/react/24/solid'
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline'
import { useCallback, useState } from 'react'

export function PlayerBar() {
  const {
    queue, currentIndex, isPlaying, volume, progress, duration,
    shuffle, repeat, togglePlay, next, prev, setVolume,
    toggleShuffle, toggleRepeat, setProgress, setLiked,
  } = usePlayerStore()

  const [prevVolume, setPrevVolume] = useState(0.8)
  const currentTrack = queue[currentIndex]

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const t = parseFloat(e.target.value)
      setProgress(t)
      ;(window as Window & { __audioSeek?: (t: number) => void }).__audioSeek?.(t)
    },
    [setProgress]
  )

  const toggleMute = () => {
    if (volume > 0) { setPrevVolume(volume); setVolume(0) }
    else setVolume(prevVolume)
  }

  const handleLike = async () => {
    if (!currentTrack?.id) return
    const newLiked = !currentTrack.liked
    try {
      if (newLiked) {
        await fetch('/api/tracks/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: currentTrack.title, artist: currentTrack.artist,
            coverUrl: currentTrack.coverUrl, downloadUrl: currentTrack.filePath,
          }),
        })
      } else {
        await fetch('/api/tracks/like', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackId: currentTrack.id }),
        })
      }
      setLiked(currentTrack.id, newLiked)
    } catch (e) { console.error(e) }
  }

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0
  const volumePct = volume * 100

  return (
    <div
      style={{
        height: 'var(--player-height)',
        background: 'var(--bg-player)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -1px 0 rgba(255,65,0,0.2), 0 -16px 48px rgba(0,0,0,0.6)',
      }}
      className="grid grid-cols-3 items-center px-5 gap-4"
    >
      {/* Left: track info */}
      <div className="flex items-center gap-3 min-w-0">
        {currentTrack ? (
          <>
            <div
              className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative"
              style={{ border: '1px solid var(--border)', boxShadow: '0 0 12px rgba(0,0,0,0.5)' }}
            >
              {currentTrack.coverUrl ? (
                <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-lg"
                  style={{ background: 'rgba(255,65,0,0.1)', color: 'var(--accent)' }}
                >
                  ♪
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate tracking-wide">{currentTrack.title}</p>
              <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                {currentTrack.artist}
              </p>
            </div>
            <button onClick={handleLike} className="flex-shrink-0 ml-1 hover:scale-110 transition-transform">
              {currentTrack.liked
                ? <HeartIcon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                : <HeartOutlineIcon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              }
            </button>
          </>
        ) : (
          <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>Выберите трек</p>
        )}
      </div>

      {/* Center: controls + progress */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-5">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            className="transition-all hover:scale-110"
            style={{ color: shuffle ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            <ArrowsRightLeftIcon className="w-4 h-4" />
          </button>

          {/* Prev */}
          <button onClick={prev} className="transition-all hover:scale-110" style={{ color: 'var(--text-muted)' }}>
            <BackwardIcon className="w-5 h-5" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
            style={{
              background: currentTrack ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
              boxShadow: currentTrack ? '0 0 20px var(--accent-glow)' : 'none',
            }}
          >
            {isPlaying
              ? <PauseIcon className="w-4 h-4 text-white" />
              : <PlayIcon className="w-4 h-4 text-white ml-0.5" />
            }
          </button>

          {/* Next */}
          <button onClick={next} className="transition-all hover:scale-110" style={{ color: 'var(--text-muted)' }}>
            <ForwardIcon className="w-5 h-5" />
          </button>

          {/* Repeat */}
          <button
            onClick={toggleRepeat}
            className="relative transition-all hover:scale-110"
            style={{ color: repeat !== 'none' ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            <ArrowPathIcon className="w-4 h-4" />
            {repeat === 'one' && (
              <span
                className="absolute -top-1.5 -right-1.5 text-[9px] font-black leading-none"
                style={{ color: 'var(--accent)' }}
              >1</span>
            )}
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 w-full max-w-sm">
          <span className="text-[10px] w-7 text-right tabular-nums" style={{ color: 'var(--text-subtle)' }}>
            {fmt(progress)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={progress}
            onChange={handleSeek}
            className="flex-1 progress-track"
            style={{ '--progress': `${progressPct}%` } as React.CSSProperties}
          />
          <span className="text-[10px] w-7 tabular-nums" style={{ color: 'var(--text-subtle)' }}>
            {fmt(duration)}
          </span>
        </div>
      </div>

      {/* Right: volume */}
      <div className="flex items-center gap-2.5 justify-end">
        <button onClick={toggleMute} className="transition-colors hover:text-white" style={{ color: 'var(--text-muted)' }}>
          {volume === 0
            ? <SpeakerXMarkIcon className="w-4 h-4" />
            : <SpeakerWaveIcon className="w-4 h-4" />
          }
        </button>
        <div className="w-20">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full volume-track"
            style={{ '--volume': `${volumePct}%` } as React.CSSProperties}
          />
        </div>
      </div>
    </div>
  )
}
