import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readFile } from 'fs/promises'
import path from 'path'
import fs from 'fs'

export const dynamic = 'force-dynamic'

const UPLOADS_DIR = process.env.UPLOADS_PATH || path.join(process.cwd(), 'uploads')

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string; filename: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Sanitize to prevent path traversal
  const userId = params.userId.replace(/[^0-9]/g, '')
  const filename = path.basename(decodeURIComponent(params.filename))

  const filePath = path.join(UPLOADS_DIR, userId, filename)

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const file = await readFile(filePath)
  const ext = path.extname(filename).toLowerCase()
  const mimeMap: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.flac': 'audio/flac',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
  }
  const contentType = mimeMap[ext] || 'audio/mpeg'

  // Support range requests for audio seeking
  const range = req.headers.get('range')
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1
    const chunkSize = end - start + 1
    const chunk = file.slice(start, end + 1)

    return new NextResponse(chunk, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${file.length}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunkSize),
        'Content-Type': contentType,
      },
    })
  }

  return new NextResponse(file, {
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(file.length),
      'Accept-Ranges': 'bytes',
    },
  })
}
