import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import db from '@/lib/db'
import { tracks, userTracks } from '@/lib/db/schema'
import { eq, and, like, or } from 'drizzle-orm'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const UPLOADS_DIR = process.env.UPLOADS_PATH || path.join(process.cwd(), 'uploads')

// GET /api/tracks - get user's library with optional search
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt(session.user.id)
  const q = req.nextUrl.searchParams.get('q') || ''

  const rows = await db
    .select({
      id: tracks.id,
      title: tracks.title,
      artist: tracks.artist,
      coverUrl: tracks.coverUrl,
      filePath: tracks.filePath,
      source: tracks.source,
      duration: tracks.duration,
      liked: userTracks.liked,
      addedAt: userTracks.addedAt,
    })
    .from(userTracks)
    .innerJoin(tracks, eq(tracks.id, userTracks.trackId))
    .where(
      q
        ? and(
            eq(userTracks.userId, userId),
            or(
              like(tracks.title, `%${q}%`),
              like(tracks.artist, `%${q}%`)
            )
          )
        : eq(userTracks.userId, userId)
    )
    .orderBy(userTracks.addedAt)

  return NextResponse.json({ tracks: rows })
}

// POST /api/tracks - upload a track from device
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt(session.user.id)
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const title = formData.get('title') as string
  const artist = formData.get('artist') as string

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const userDir = path.join(UPLOADS_DIR, String(userId))
  await mkdir(userDir, { recursive: true })

  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const filePath = path.join(userDir, filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filePath, buffer)

  const relativePath = `/api/audio/${userId}/${filename}`

  const [track] = await db
    .insert(tracks)
    .values({
      title: title || file.name.replace(/\.[^.]+$/, ''),
      artist: artist || 'Unknown',
      filePath: relativePath,
      source: 'local',
      mimeType: file.type || 'audio/mpeg',
    })
    .returning()

  await db.insert(userTracks).values({ userId, trackId: track.id, liked: false })

  return NextResponse.json({ track }, { status: 201 })
}
