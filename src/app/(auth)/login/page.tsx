'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) setError('Неверный email или пароль')
    else router.push('/')
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,65,0,0.06) 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: 'var(--accent)',
              boxShadow: '0 0 40px var(--accent-glow)',
            }}
          >
            <MusicalNoteIcon className="w-7 h-7 text-white" />
          </div>
          <h1
            className="text-xl font-black tracking-widest uppercase text-white"
            style={{ fontFamily: 'var(--font)' }}
          >
            Masya<span style={{ color: 'var(--accent)' }}>Music</span>
          </h1>
          <p className="text-xs mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>
            ВОЙДИТЕ В СИСТЕМУ
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              className="rounded-xl px-4 py-3 text-xs font-medium"
              style={{
                background: 'rgba(255,65,0,0.1)',
                border: '1px solid rgba(255,65,0,0.3)',
                color: '#ff8c6b',
              }}
            >
              {error}
            </div>
          )}

          {[
            { label: 'EMAIL', value: email, set: setEmail, type: 'email', placeholder: 'you@example.com' },
            { label: 'ПАРОЛЬ', value: password, set: setPassword, type: 'password', placeholder: '••••••••' },
          ].map(({ label, value, set, type, placeholder }) => (
            <div key={label}>
              <label
                className="block text-[10px] font-bold mb-2 tracking-widest"
                style={{ color: 'var(--text-muted)' }}
              >
                {label}
              </label>
              <input
                type={type}
                value={value}
                onChange={(e) => set(e.target.value)}
                required
                placeholder={placeholder}
                className="input-styled w-full px-4 py-3 rounded-xl"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="btn-accent w-full py-3.5 rounded-xl text-xs font-black tracking-widest uppercase disabled:opacity-50 disabled:transform-none"
          >
            {loading ? 'ВХОДИМ...' : 'ВОЙТИ'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Нет аккаунта?{' '}
          <Link href="/register" className="font-bold text-white hover:underline" style={{ color: 'var(--accent)' }}>
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  )
}
