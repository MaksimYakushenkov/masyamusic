'use client'

import { useRef, useState } from 'react'
import { XMarkIcon, ArrowUpTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon, ExclamationCircleIcon, MinusCircleIcon } from '@heroicons/react/24/solid'

interface ImportResult {
  query: string
  status: 'pending' | 'loading' | 'ok' | 'already_exists' | 'not_found' | 'error'
  title?: string
  artist?: string
  error?: string
}

interface ImportModalProps {
  onClose: () => void
  onDone: () => void
}

export function ImportModal({ onClose, onDone }: ImportModalProps) {
  const [text, setText] = useState('')
  const [results, setResults] = useState<ImportResult[]>([])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef(false)

  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setText((ev.target?.result as string) || '')
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }

  const parseLines = (raw: string) =>
    raw.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)

  const startImport = async () => {
    const lines = parseLines(text)
    if (!lines.length) return
    abortRef.current = false
    setRunning(true)
    setDone(false)
    setResults(lines.map((q) => ({ query: q, status: 'pending' })))

    for (let i = 0; i < lines.length; i++) {
      if (abortRef.current) break
      setResults((prev) => prev.map((r, idx) => idx === i ? { ...r, status: 'loading' } : r))
      const res = await fetch('/api/tracks/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: lines[i] }),
      })
      const data = await res.json()
      if (data.status === 'error' || !res.ok) {
        console.error(`Import error [${lines[i]}]:`, data.error ?? data)
      }
      setResults((prev) => prev.map((r, idx) =>
        idx === i ? { ...r, status: data.status ?? 'error', title: data.title, artist: data.artist, error: data.error } : r
      ))
    }

    setRunning(false)
    setDone(true)
    onDone()
  }

  const completed = results.filter((r) => r.status !== 'pending' && r.status !== 'loading').length
  const total = results.length
  const progressPct = total > 0 ? (completed / total) * 100 : 0

  const statusIcon = (r: ImportResult) => {
    if (r.status === 'loading') return (
      <div className="w-4 h-4 rounded-full border-2 animate-spin flex-shrink-0"
        style={{ borderColor: 'rgba(255,65,0,0.2)', borderTopColor: 'var(--accent)' }} />
    )
    if (r.status === 'ok') return <CheckCircleIcon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent)' }} />
    if (r.status === 'already_exists') return <CheckCircleIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
    if (r.status === 'not_found') return <MinusCircleIcon className="w-4 h-4 text-yellow-500 flex-shrink-0" />
    if (r.status === 'error') return <ExclamationCircleIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
    return <div className="w-4 h-4 rounded-full border flex-shrink-0" style={{ borderColor: 'var(--border)' }} />
  }

  const statusText = (r: ImportResult) => {
    if (r.status === 'loading') return 'Ищем...'
    if (r.status === 'ok') return `${r.artist} — ${r.title}`
    if (r.status === 'already_exists') return `Уже есть: ${r.artist} — ${r.title}`
    if (r.status === 'not_found') return 'Не найдено'
    if (r.status === 'error') return r.error ? `Ошибка: ${r.error}` : 'Ошибка'
    return ''
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="rounded-2xl w-full max-w-lg flex flex-col max-h-[88vh] shadow-2xl"
        style={{ background: 'rgba(20,20,20,0.98)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: 'var(--font)' }}>
            Импорт треков
          </h3>
          <button onClick={onClose} disabled={running} className="transition-colors hover:text-white disabled:opacity-30" style={{ color: 'var(--text-muted)' }}>
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {!results.length ? (
            <>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Каждая строка — один запрос. Формат: <span className="text-white">Исполнитель — Трек</span>
              </p>

              <div
                className="rounded-xl px-4 py-3 text-xs font-mono space-y-0.5"
                style={{ background: 'rgba(255,65,0,0.04)', border: '1px solid rgba(255,65,0,0.1)', color: 'var(--text-muted)' }}
              >
                <p>Любэ - Хочу жить</p>
                <p>Oxxxymiron - Биполярочка</p>
                <p>Кино - Звезда по имени Солнце</p>
              </div>

              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl font-semibold transition-all hover:border-white/30"
                style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              >
                <DocumentTextIcon className="w-4 h-4" />
                Загрузить .txt файл
              </button>
              <input ref={fileRef} type="file" accept=".txt,text/plain" className="hidden" onChange={handleFileLoad} />

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Или вставьте список вручную..."
                rows={9}
                className="input-styled w-full rounded-xl px-4 py-3 text-xs resize-none"
                style={{ lineHeight: '1.8' }}
              />
            </>
          ) : (
            <>
              {/* Progress */}
              <div>
                <div className="flex justify-between text-[10px] mb-2 font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  <span>{done ? 'Готово' : 'Импорт...'}</span>
                  <span>{completed} / {total}</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%`, background: 'var(--accent)', boxShadow: '0 0 8px var(--accent-glow)' }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5">
                    {statusIcon(r)}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-white truncate">{r.query}</p>
                      {r.status !== 'pending' && (
                        <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {statusText(r)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between gap-3" style={{ borderTop: '1px solid var(--border)' }}>
          {!results.length ? (
            <>
              <p className="text-[10px] font-medium" style={{ color: 'var(--text-subtle)' }}>
                {parseLines(text).length > 0 ? `${parseLines(text).length} треков` : ''}
              </p>
              <button
                onClick={startImport}
                disabled={!parseLines(text).length}
                className="btn-accent flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase disabled:opacity-40 disabled:transform-none"
              >
                <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                Импортировать
              </button>
            </>
          ) : (
            <>
              {running ? (
                <button onClick={() => { abortRef.current = true }} className="text-xs font-medium transition-colors hover:text-white" style={{ color: 'var(--text-muted)' }}>
                  Остановить
                </button>
              ) : (
                <button onClick={onClose} className="text-xs font-medium transition-colors hover:text-white" style={{ color: 'var(--text-muted)' }}>
                  Закрыть
                </button>
              )}
              {done && (
                <p className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
                  ✓ {results.filter(r => r.status === 'ok').length} добавлено
                  {results.filter(r => r.status === 'not_found' || r.status === 'error').length > 0 &&
                    `, ${results.filter(r => r.status === 'not_found' || r.status === 'error').length} не найдено`}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
