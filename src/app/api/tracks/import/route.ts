import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { searchHitmotop } from '@/lib/scraper'
import { downloadAndSaveTrack } from '@/lib/downloadTrack'

// POST /api/tracks/import
// Body: { query: string }  — one query at a time (client loops)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt(session.user.id)
  const { query } = await req.json()

  if (!query?.trim()) {
    return NextResponse.json({ error: 'query required' }, { status: 400 })
  }

  try {
    const results = await searchHitmotop(query.trim())

    if (!results.length) {
      return NextResponse.json({ status: 'not_found', query })
    }

    const top = results[0]
    const { trackId, alreadyExists } = await downloadAndSaveTrack({
      userId,
      title: top.title,
      artist: top.artist,
      coverUrl: top.coverUrl,
      downloadUrl: top.downloadUrl,
      liked: true,
    })

    return NextResponse.json({
      status: alreadyExists ? 'already_exists' : 'ok',
      query,
      trackId,
      title: top.title,
      artist: top.artist,
    })
  } catch (err) {
    console.error(`Import error for "${query}":`, err)
    return NextResponse.json({ status: 'error', query, error: String(err) })
  }
}
