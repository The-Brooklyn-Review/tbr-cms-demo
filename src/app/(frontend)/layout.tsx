import React from 'react'
import { Fraunces, Newsreader, Source_Sans_3, IBM_Plex_Mono } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const display = Fraunces({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const body = Newsreader({ subsets: ['latin'], variable: '--font-body', display: 'swap' })
const ui = Source_Sans_3({ subsets: ['latin'], variable: '--font-ui', display: 'swap' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400'], variable: '--font-mono', display: 'swap' })

export const metadata = {
  title: 'The Brooklyn Review — CMS demo',
  description: 'A working demo of the editorial workflow: publish in the CMS, see it on the site.',
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${ui.variable} ${mono.variable}`}>
      <body>
        <header className="masthead">
          <div className="wrap masthead-inner">
            <Link href="/" className="wordmark">
              The Brooklyn Review
            </Link>
            <nav>
              <Link href="/">Latest</Link>
              <Link href="/archive">Archive</Link>
              <a href="/admin">CMS</a>
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="site">
          <div className="wrap meta">
            The Brooklyn Review · Brooklyn College · workflow demo
          </div>
        </footer>
      </body>
    </html>
  )
}
