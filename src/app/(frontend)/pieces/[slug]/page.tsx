import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { RichBody } from '../../RichBody'

export const dynamic = 'force-dynamic'

export default async function PiecePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'pieces',
    where: { slug: { equals: slug } },
    depth: 3,
    limit: 1,
  })

  const piece: any = docs[0]
  if (!piece) notFound()

  const contributors = (piece.contributors || []).filter((c: any) => typeof c === 'object')
  const artworks = (piece.artwork || []).filter((a: any) => typeof a === 'object')
  const related = (piece.relatedPieces || []).filter((p: any) => typeof p === 'object')

  // artists come from the artwork, so credits are never retyped
  const artists = artworks
    .map((a: any) => (typeof a.artist === 'object' ? a.artist : null))
    .filter(Boolean)
  const people = [...contributors, ...artists].filter(
    (p: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === p.id) === i,
  )

  return (
    <article
      className="article"
      style={piece.accentColor ? ({ ['--accent' as any]: piece.accentColor }) : undefined}
    >
      <header className="article-head">
        <span className="kicker">
          {typeof piece.genre === 'object' ? piece.genre.name : ''}
          {typeof piece.issue === 'object' ? ` · ${piece.issue.title}` : ''}
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

      {artworks[0] && typeof artworks[0].image === 'object' ? (
        <figure>
          <img src={artworks[0].image.url} alt={artworks[0].image.alt || artworks[0].title} />
          <figcaption>
            <em>{artworks[0].title}</em>
            {artworks[0].medium ? `, ${artworks[0].medium}` : ''}
            {artworks[0].year ? `, ${artworks[0].year}` : ''}
            {typeof artworks[0].artist === 'object' ? ` · ${artworks[0].artist.name}` : ''}
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
          <span className="meta">Read next — chosen by the editors</span>
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
  )
}
