'use client'

import React from 'react'
import Link from 'next/link'
import { useLivePreview } from '@payloadcms/live-preview-react'
import { PayloadAdminBar } from '@payloadcms/admin-bar'
import { RichBody } from '../../RichBody'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://tbr-cms-demo.vercel.app'

// Renders inside the admin's Live Preview iframe as well as on the public
// site. useLivePreview listens for postMessage updates from the admin as an
// editor types, so the preview updates without saving — outside the iframe
// it just renders the server-fetched data unchanged.
export function PieceArticle({ initialPiece }: { initialPiece: any }) {
  const { data: piece } = useLivePreview<any>({
    initialData: initialPiece,
    serverURL: SITE_URL,
    depth: 3,
  })

  // Only visible to a logged-in editor — renders nothing for regular
  // readers. Bumps the page down while it's showing so it doesn't cover
  // the masthead.
  const [showingAdminBar, setShowingAdminBar] = React.useState(false)

  const contributors = (piece.contributors || []).filter((c: any) => c && typeof c === 'object')
  const artworks = (piece.artwork || []).filter((a: any) => a && typeof a === 'object')
  const related = (piece.relatedPieces || []).filter((p: any) => p && typeof p === 'object')

  // artists come from the artwork, so credits are never retyped
  const artists = artworks
    .map((a: any) => (a.artist && typeof a.artist === 'object' ? a.artist : null))
    .filter(Boolean)
  const people = [...contributors, ...artists].filter(
    (p: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === p.id) === i,
  )

  return (
    <>
      <PayloadAdminBar
        cmsURL={SITE_URL}
        collectionSlug="pieces"
        id={piece.id}
        onAuthChange={(user) => setShowingAdminBar(!!user)}
      />
      <article
        className="article"
        style={{
          ...(piece.accentColor ? { ['--accent' as any]: piece.accentColor } : undefined),
          ...(showingAdminBar ? { marginTop: '3rem' } : undefined),
        }}
      >
      <header className="article-head">
        <span className="kicker">
          {piece.genre && typeof piece.genre === 'object' ? piece.genre.name : ''}
          {piece.issue && typeof piece.issue === 'object' ? ` · ${piece.issue.title}` : ''}
        </span>
        <h1>{piece.title}</h1>
        {piece.deck ? <p className="deck">{piece.deck}</p> : null}
        <p className="byline">
          By{' '}
          {contributors.map((c: any, i: number) => (
            <React.Fragment key={c.id}>
              {i > 0 ? ' & ' : ''}
              <Link href={`/contributors/${c.slug}`}>{c.name}</Link>
            </React.Fragment>
          ))}
        </p>
      </header>

      {artworks[0] && artworks[0].image && typeof artworks[0].image === 'object' ? (
        <figure>
          <img src={artworks[0].image.url} alt={artworks[0].image.alt || artworks[0].title} />
          <figcaption>
            <em>{artworks[0].title}</em>
            {artworks[0].medium ? `, ${artworks[0].medium}` : ''}
            {artworks[0].year ? `, ${artworks[0].year}` : ''}
            {artworks[0].artist && typeof artworks[0].artist === 'object' ? ` · ${artworks[0].artist.name}` : ''}
          </figcaption>
        </figure>
      ) : null}

      <RichBody data={piece.body} />

      {people.length ? (
        <section className="bios">
          {people.map((p: any) => (
            <div className="bio" key={p.id}>
              <span className="n">
                <Link href={`/contributors/${p.slug}`}>{p.name}</Link>
              </span>
              <span className="r">{(p.roles || []).join(' · ')}</span>
              {p.bio ? <RichBody data={p.bio} /> : null}
            </div>
          ))}
        </section>
      ) : null}

      {related.length ? (
        <section className="related">
          <span className="meta">Read next</span>
          <ul className="piece-list">
            {related.map((r: any) => (
              <li key={r.id}>
                <Link href={`/pieces/${r.slug}`}>
                  <span className="t">{r.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      </article>
    </>
  )
}
