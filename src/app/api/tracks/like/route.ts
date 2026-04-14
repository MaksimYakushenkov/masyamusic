import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import db from '@/lib/db'
import { userTracks } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { downloadAndSaveTrack } from '@/lib/downloadTrack'

// POST /api/tracks/like
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt(session.user.id)
  const { title, artist, coverUrl, downloadUrl } = await req.json()

  if (!downloadUrl) return NextResponse.json({ error: 'downloadUrl required' }, { status: 400 })

  try {
    const { trackId } = await downloadAndSaveTrack({ userId, title, artist, coverUrl, downloadUrl, liked: true })
    return NextResponse.json({ trackId })
  } catch (err) {
    console.error('Like error:', err)
    return NextResponse.json({ error: 'Failed to save track' }, { status: 500 })
  }
}

// DELETE /api/tracks/like
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt(session.user.id)
  const { trackId } = await req.json()

  await db
    .update(userTracks)
    .set({ liked: false })
    .where(and(eq(userTracks.userId, userId), eq(userTracks.trackId, trackId)))

  return NextResponse.json({ ok: true })
}
