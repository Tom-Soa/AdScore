'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Zap, History } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'Analyser', icon: Zap },
  { href: '/historique', label: 'Historique', icon: History },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-white/5 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-white text-base tracking-tight">AdScore</span>
          <span className="text-violet-500/50 text-[10px] font-mono">AI</span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans transition-all',
                pathname === href
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
