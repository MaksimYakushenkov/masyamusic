import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import db from '@/lib/db'
import { playlists, playlistTracks, tracks, userTracks } from '@/lib/db/schema'
import { eq, and, max } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// GET /api/playlists/[id] - get playlist with tracks
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt(session.user.id)
  const playlistId = parseInt(params.id)

  const [playlist] = await db
    .select()
    .from(playlists)
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)))
    .limit(1)

  if (!playlist) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const rows = await db
    .select({
      id: tracks.id,
      title: tracks.title,
      artist: tracks.artist,
      coverUrl: tracks.coverUrl,
      filePath: tracks.filePath,
      source: tracks.source,
      duration: tracks.duration,
      position: playlistTracks.position,
      liked: userTracks.liked,
    })
    .from(playlistTracks)
    .innerJoin(tracks, eq(tracks.id, playlistTracks.trackId))
    .leftJoin(
      userTracks,
      and(eq(userTracks.trackId, tracks.id), eq(userTracks.userId, userId))
    )
    .where(eq(playlistTracks.playlistId, playlistId))
    .orderBy(playlistTracks.position)

  return NextResponse.json({ playlist, tracks: rows })
}

// PATCH /api/playlists/[id] - rename playlist
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt(session.user.id)
  const playlistId = parseInt(params.id)
  const { name } = await req.json()

  await db
    .update(playlists)
    .set({ name })
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)))

  return NextResponse.json({ ok: true })
}

// DELETE /api/playlists/[id] - delete playlist
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt(session.user.id)
  const playlistId = parseInt(params.id)

  await db
    .delete(playlists)
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)))

  return NextResponse.json({ ok: true })
}
