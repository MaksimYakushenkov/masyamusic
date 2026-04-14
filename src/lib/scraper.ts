import * as cheerio from 'cheerio'

export interface ScrapedTrack {
  title: string
  artist: string
  coverUrl: string
  downloadUrl: string
}

export async function searchHitmotop(query: string): Promise<ScrapedTrack[]> {
  const encoded = encodeURIComponent(query)
  const url = `https://rus.hitmotop.com/search?q=${encoded}`

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
    },
  })

  if (!res.ok) throw new Error(`Hitmotop responded with ${res.status}`)

  const html = await res.text()
  const $ = cheerio.load(html)
  const results: ScrapedTrack[] = []

  $('.tracks__list .tracks__item.track').each((_, el) => {
    const $el = $(el)

    const title = $el.find('.track__title').text().trim()
    const artist = $el.find('.track__desc').text().trim()

    // Cover: background-image url from .track__img
    const imgStyle = $el.find('.track__img').attr('style') || ''
    const coverMatch = imgStyle.match(/url\(['"]?([^'")\s]+)['"]?\)/)
    const coverUrl = coverMatch ? coverMatch[1] : ''

    // Download link — make absolute if relative
    const rawHref = $el.find('.track__download-btn').attr('href') || ''
    const downloadUrl = rawHref.startsWith('http') ? rawHref : `https://rus.hitmotop.com${rawHref}`

    // Cover — make absolute if relative
    const absoluteCover = coverUrl.startsWith('http') ? coverUrl : coverUrl ? `https://rus.hitmotop.com${coverUrl}` : ''

    if (title && rawHref) {
      results.push({ title, artist, coverUrl: absoluteCover, downloadUrl })
    }
  })

  return results
}
