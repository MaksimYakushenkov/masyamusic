'use client'

import { useEffect, useRef } from 'react'
import { usePlayerStore } from '@/store/player'

export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { queue, currentIndex, isPlaying, volume, setProgress, setDuration, next } =
    usePlayerStore()

  const currentTrack = queue[currentIndex]

  // Initialize audio element once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.preload = 'metadata'
    }
    const audio = audioRef.current

    const onTimeUpdate = () => setProgress(audio.currentTime)
    const onDurationChange = () => setDuration(audio.duration || 0)
    const onEnded = () => next()

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // Track change
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return
    audio.src = currentTrack.filePath
    audio.load()
    if (isPlaying) audio.play().catch(console.error)
  }, [currentIndex, currentTrack?.filePath]) // eslint-disable-line react-hooks/exhaustive-deps

  // Play/pause
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return
    if (isPlaying) {
      audio.play().catch(console.error)
    } else {
      audio.pause()
    }
  }, [isPlaying]) // eslint-disable-line react-hooks/exhaustive-deps

  // Volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  // Expose seek function via global (used by player controls)
  useEffect(() => {
    ;(window as Window & { __audioSeek?: (t: number) => void }).__audioSeek = (t: number) => {
      if (audioRef.current) audioRef.current.currentTime = t
    }
  }, [])

  return null
}
