import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

const byline = (contributors: any[]) =>
  (contributors || []).map((c: any) => (typeof c === 'object' ? c.name : '')).filter(Boolean).join(' & ')

export default async function HomePage() {
  const payload = await getPayload({ config })

  const { docs: pieces } = await payload.find({
    collection: 'pieces',
    depth: 2,
    limit: 100,
    sort: '-publishedAt',
  })

  const lead = pieces.find((p: any) => p.featured) || pieces[0]
  const rest = pieces.filter((p: any) => p.id !== lead?.id)

  // group the remainder by issue, newest issue first
  const groups = new Map<string, { title: string; items: any[] }>()
  for (const p of rest as any[]) {
    const issue = typeof p.issue === 'object' ? p.issue : null
    const key = issue?.id ?? 'none'
    if (!groups.has(key)) groups.set(key, { title: issue?.title ?? 'Unassigned', items: [] })
    groups.get(key)!.items.push(p)
  }

  if (!lead) {
    return (
      <p style={{ padding: '4rem 0' }}>
        Nothing published yet. Head to <a href="/admin">the CMS</a> and publish a piece — it shows up here.
      </p>
    )
  }

  const leadArt = Array.isArray(lead.artwork) && typeof lead.artwork[0] === 'object' ? lead.artwork[0] : null
  const leadImg = leadArt && typeof leadArt.image === 'object' ? leadArt.image : null

  return (
    <>
      <section className="lead" style={lead.accentColor ? ({ ['--accent' as any]: lead.accentColor }) : undefined}>
        {leadImg?.url ? <img className="lead-art" src={leadImg.url} alt={leadImg.alt || ''} /> : null}
        <span className="kicker">
          {typeof lead.genre === 'object' ? lead.genre.name : ''}
          {typeof lead.issue === 'object' ? ` · ${lead.issue.title}` : ''}
        </span>
        <h1>
          <Link href={`/pieces/${lead.slug}`}>{lead.title}</Link>
        </h1>
        {lead.deck ? <p className="deck">{lead.deck}</p> : null}
        <p className="meta">By {byline(lead.contributors as any[])}</p>
      </section>

      {[...groups.values()].map((g) => (
        <section className="issue-group" key={g.title}>
          <div className="issue-head">
            <h2>{g.title}</h2>
            <span className="meta">{g.items.length} pieces</span>
          </div>
          <ul className="piece-list">
            {g.items.map((p: any) => (
              <li key={p.id}>
                <Link href={`/pieces/${p.slug}`}>
                  <span className="kicker">{typeof p.genre === 'object' ? p.genre.name : ''}</span>
                  <span className="t">{p.title}</span>
                  <span className="by">{byline(p.contributors)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}
