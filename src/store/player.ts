'use client'

import { create } from 'zustand'

export interface PlayerTrack {
  id?: number
  title: string
  artist: string
  coverUrl?: string | null
  filePath: string
  liked?: boolean
}

interface PlayerState {
  queue: PlayerTrack[]
  currentIndex: number
  isPlaying: boolean
  volume: number
  progress: number
  duration: number
  shuffle: boolean
  repeat: 'none' | 'one' | 'all'

  setQueue: (tracks: PlayerTrack[], startIndex?: number) => void
  playTrack: (track: PlayerTrack) => void
  togglePlay: () => void
  next: () => void
  prev: () => void
  setProgress: (p: number) => void
  setDuration: (d: number) => void
  setVolume: (v: number) => void
  toggleShuffle: () => void
  toggleRepeat: () => void
  setLiked: (trackId: number, liked: boolean) => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  volume: 0.8,
  progress: 0,
  duration: 0,
  shuffle: false,
  repeat: 'none',

  setQueue: (tracks, startIndex = 0) =>
    set({ queue: tracks, currentIndex: startIndex, isPlaying: true }),

  playTrack: (track) => {
    const { queue } = get()
    const idx = queue.findIndex((t) => t.filePath === track.filePath)
    if (idx !== -1) {
      set({ currentIndex: idx, isPlaying: true })
    } else {
      set({ queue: [track, ...queue], currentIndex: 0, isPlaying: true })
    }
  },

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

  next: () => {
    const { queue, currentIndex, shuffle, repeat } = get()
    if (!queue.length) return
    if (repeat === 'one') {
      set({ isPlaying: true })
      return
    }
    let next: number
    if (shuffle) {
      next = Math.floor(Math.random() * queue.length)
    } else {
      next = currentIndex + 1
      if (next >= queue.length) {
        if (repeat === 'all') next = 0
        else { set({ isPlaying: false }); return }
      }
    }
    set({ currentIndex: next, isPlaying: true, progress: 0 })
  },

  prev: () => {
    const { currentIndex, queue } = get()
    const prev = currentIndex > 0 ? currentIndex - 1 : 0
    set({ currentIndex: prev, isPlaying: true, progress: 0 })
  },

  setProgress: (p) => set({ progress: p }),
  setDuration: (d) => set({ duration: d }),
  setVolume: (v) => set({ volume: v }),
  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  toggleRepeat: () =>
    set((s) => ({
      repeat: s.repeat === 'none' ? 'all' : s.repeat === 'all' ? 'one' : 'none',
    })),

  setLiked: (trackId, liked) =>
    set((s) => ({
      queue: s.queue.map((t) => (t.id === trackId ? { ...t, liked } : t)),
    })),
}))
