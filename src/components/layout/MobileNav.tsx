'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MagnifyingGlassIcon, BookmarkSquareIcon, HeartIcon } from '@heroicons/react/24/outline'

const items = [
  { href: '/search',           label: 'Поиск',    Icon: MagnifyingGlassIcon },
  { href: '/library',          label: 'Библиотека', Icon: BookmarkSquareIcon },
  { href: '/library?filter=liked', label: 'Любимые', Icon: HeartIcon },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="flex md:hidden"
      style={{
        background: 'rgba(14,14,14,0.97)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid var(--border)',
      }}
    >
      {items.map(({ href, label, Icon }) => {
        const active = pathname === href || (href !== '/library?filter=liked' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={`mobile-nav-item${active ? ' mobile-nav-item--active' : ''}`}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
