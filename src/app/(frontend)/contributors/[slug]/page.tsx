import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { RichBody } from '../../RichBody'

export const dynamic = 'force-dynamic'

export default async function ContributorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'contributors',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  })
  const person: any = docs[0]
  if (!person) notFound()

  const { docs: written } = await payload.find({
    collection: 'pieces',
    where: { contributors: { contains: person.id } },
    depth: 2,
    limit: 50,
  })

  const { docs: art } = await payload.find({
    collection: 'artworks',
    where: { artist: { equals: person.id } },
    depth: 1,
    limit: 50,
  })

  return (
    <div className="article">
      <header className="article-head">
        <span className="kicker">{(person.roles || []).join(' · ')}</span>
        <h1>{person.name}</h1>
      </header>
      {person.bio ? <RichBody data={person.bio} /> : null}

      {written.length ? (
        <section className="related">
          <span className="meta">Writing</span>
          <ul className="piece-list">
            {written.map((p: any) => (
              <li key={p.id}>
                <Link href={`/pieces/${p.slug}`}>
                  <span className="t">{p.title}</span>
                  <span className="by">{p.issue && typeof p.issue === 'object' ? p.issue.title : ''}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {art.length ? (
        <section className="related">
          <span className="meta">Artwork</span>
          <ul className="piece-list">
            {art.map((a: any) => (
              <li key={a.id}>
                <span className="t">{a.title}</span>
                <span className="by">
                  {a.medium}
                  {a.year ? `, ${a.year}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
