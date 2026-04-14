import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import db from '@/lib/db'
import { playlists, playlistTracks, tracks } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// GET /api/playlists - get user's playlists
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt(session.user.id)
  const rows = await db.select().from(playlists).where(eq(playlists.userId, userId))

  return NextResponse.json({ playlists: rows })
}

// POST /api/playlists - create playlist
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt(session.user.id)
  const { name } = await req.json()

  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const [playlist] = await db.insert(playlists).values({ userId, name }).returning()
  return NextResponse.json({ playlist }, { status: 201 })
}
