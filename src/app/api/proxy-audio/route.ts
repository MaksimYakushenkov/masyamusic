import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGIN = 'https://rus.hitmotop.com'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

  // Security: only proxy hitmotop URLs
  if (!url.startsWith(ALLOWED_ORIGIN)) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  const range = req.headers.get('range')

  const fetchHeaders: HeadersInit = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Referer: 'https://rus.hitmotop.com/',
    Origin: 'https://rus.hitmotop.com',
    Accept: 'audio/mpeg,audio/*,*/*;q=0.9',
    'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
  }
  if (range) fetchHeaders['Range'] = range

  let upstream: Response
  try {
    upstream = await fetch(url, { headers: fetchHeaders })
  } catch {
    return NextResponse.json({ error: 'Upstream fetch failed' }, { status: 502 })
  }

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json({ error: `Upstream: ${upstream.status}` }, { status: upstream.status })
  }

  const resHeaders = new Headers()
  resHeaders.set('Content-Type', upstream.headers.get('Content-Type') || 'audio/mpeg')
  resHeaders.set('Accept-Ranges', 'bytes')
  resHeaders.set('Cache-Control', 'public, max-age=3600')

  const contentLength = upstream.headers.get('Content-Length')
  if (contentLength) resHeaders.set('Content-Length', contentLength)
  const contentRange = upstream.headers.get('Content-Range')
  if (contentRange) resHeaders.set('Content-Range', contentRange)

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  })
}
