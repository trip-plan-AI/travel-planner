'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Map, MessageSquare, User } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

const NAV = [
  { href: '/', icon: Home, label: 'Главная' },
  { href: '/planner', icon: Map, label: 'Планировщик' },
  { href: '/ai-assistant', icon: MessageSquare, label: 'AI Ассистент' },
  { href: '/profile', icon: User, label: 'Профиль' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-16 bg-brand-indigo flex flex-col items-center py-4 gap-6 z-50">
      {/* Логотип */}
      <div className="bg-brand-sky text-white p-2 rounded-xl mb-2">
        <Map size={20} />
      </div>

      {/* Навигация */}
      {NAV.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          title={label}
          className={cn(
            'p-3 rounded-2xl text-white/60 hover:text-white hover:bg-white/10 transition-colors',
            pathname === href && 'bg-white/20 text-white rounded-2xl shadow-lg',
          )}
        >
          <Icon size={20} />
        </Link>
      ))}
    </aside>
  )
}
