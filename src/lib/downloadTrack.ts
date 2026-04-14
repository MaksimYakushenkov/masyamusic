import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import db from '@/lib/db'
import { tracks, userTracks } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

const UPLOADS_DIR = process.env.UPLOADS_PATH || path.join(process.cwd(), 'uploads')

/** Sanitize a string to be safe as a filename */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200)
}

/**
 * Downloads a track from `downloadUrl`, saves it on disk as
 * `{artist} - {title}.mp3`, creates a DB record and links it to the user.
 * Returns the track id.
 */
export async function downloadAndSaveTrack({
  userId,
  title,
  artist,
  coverUrl,
  downloadUrl,
  liked = false,
}: {
  userId: number
  title: string
  artist: string
  coverUrl?: string | null
  downloadUrl: string
  liked?: boolean
}): Promise<{ trackId: number; alreadyExists: boolean }> {
  // Check if already saved (by download URL used as origin key)
  const [existing] = await db
    .select({ id: tracks.id })
    .from(tracks)
    .where(eq(tracks.filePath, downloadUrl))
    .limit(1)

  let trackId: number
  let alreadyExists = false

  if (existing) {
    trackId = existing.id
    alreadyExists = true
  } else {
    const res = await fetch(downloadUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Referer: 'https://rus.hitmotop.com/',
      },
    })

    if (!res.ok) throw new Error(`Download failed: ${res.status}`)

    const buffer = Buffer.from(await res.arrayBuffer())
    const userDir = path.join(UPLOADS_DIR, String(userId))
    await mkdir(userDir, { recursive: true })

    const safeName = sanitizeFilename(`${artist} - ${title}`)
    // Avoid collisions: append suffix only if file exists
    let filename = `${safeName}.mp3`
    let counter = 1
    const fs = await import('fs')
    while (fs.existsSync(path.join(userDir, filename))) {
      filename = `${safeName} (${counter++}).mp3`
    }

    await writeFile(path.join(userDir, filename), buffer)

    const relativePath = `/api/audio/${userId}/${encodeURIComponent(filename)}`

    const [track] = await db
      .insert(tracks)
      .values({
        title,
        artist,
        coverUrl: coverUrl || null,
        filePath: relativePath,
        source: 'hitmotop',
        mimeType: 'audio/mpeg',
      })
      .returning()

    trackId = track.id
  }

  // Upsert user_tracks
  const [existingLink] = await db
    .select()
    .from(userTracks)
    .where(and(eq(userTracks.userId, userId), eq(userTracks.trackId, trackId)))
    .limit(1)

  if (existingLink) {
    if (liked && !existingLink.liked) {
      await db
        .update(userTracks)
        .set({ liked: true })
        .where(and(eq(userTracks.userId, userId), eq(userTracks.trackId, trackId)))
    }
  } else {
    await db.insert(userTracks).values({ userId, trackId, liked })
  }

  return { trackId, alreadyExists }
}
