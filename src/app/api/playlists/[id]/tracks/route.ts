import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import db from '@/lib/db'
import { playlists, playlistTracks } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'

// POST /api/playlists/[id]/tracks - add track to playlist
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt(session.user.id)
  const playlistId = parseInt(params.id)
  const { trackId } = await req.json()

  const [playlist] = await db
    .select()
    .from(playlists)
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)))
    .limit(1)

  if (!playlist) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [{ maxPos }] = await db
    .select({ maxPos: sql<number>`MAX(position)` })
    .from(playlistTracks)
    .where(eq(playlistTracks.playlistId, playlistId))

  await db.insert(playlistTracks).values({
    playlistId,
    trackId,
    position: (maxPos ?? -1) + 1,
  })

  return NextResponse.json({ ok: true })
}

// DELETE /api/playlists/[id]/tracks - remove track from playlist
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt(session.user.id)
  const playlistId = parseInt(params.id)
  const { trackId } = await req.json()

  const [playlist] = await db
    .select()
    .from(playlists)
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)))
    .limit(1)

  if (!playlist) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db
    .delete(playlistTracks)
    .where(
      and(eq(playlistTracks.playlistId, playlistId), eq(playlistTracks.trackId, trackId))
    )

  return NextResponse.json({ ok: true })
}
