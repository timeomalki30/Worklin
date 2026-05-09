'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NavProps {
  variant?: 'public' | 'artisan-cta'
}

export default function Nav({ variant = 'public' }: NavProps) {
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  return (
    <header className={`nav${scrolled ? ' scrolled' : ''}`} id="nav">
      <div className="container nav-inner">
        <Link href="/" className="logo">
          <span className="logo-mark"><span>A</span></span>
          Worklin
        </Link>

        <nav>
          <ul className="nav-links">
            <li><Link href="/#categories">Métiers</Link></li>
            <li><Link href="/#how">Comment ça marche</Link></li>
            <li><Link href="/#artisans">Devenir artisan</Link></li>
          </ul>
        </nav>

        <div className="nav-actions">
          <Link href="/login" className="btn btn-ghost btn-sm">Mon espace</Link>
          <Link href="/recherche" className="btn btn-primary btn-sm">
            Trouver un artisan
            <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </div>
    </header>
  )
}
