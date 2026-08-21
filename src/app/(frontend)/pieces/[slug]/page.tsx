import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { PieceArticle } from './PieceArticle'

/**
 * Statically generated at build time, then rebuilt per-path whenever an editor
 * publishes (see hooks/revalidate.ts). Readers are served from the CDN and
 * never touch Postgres, which is what keeps this inside free-tier limits and
 * immune to connection-pool exhaustion under traffic.
 *
 * Editors previewing a draft get the dynamic path instead, via draft mode.
 */
export const revalidate = false

export async function generateStaticParams() {
  // Prerendering needs the database, which makes the build a moment where an
  // unreachable or sleeping Postgres could fail the whole deploy. It shouldn't:
  // with no params returned, pages simply render on first request and cache
  // from there. Degrade to that rather than shipping nothing.
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'pieces',
      where: { _status: { equals: 'published' } },
      select: { slug: true },
      limit: 1000,
      pagination: false,
    })

    return docs.filter((piece) => piece.slug).map((piece) => ({ slug: piece.slug! }))
  } catch (error) {
    console.error('[build] Could not prerender pieces; falling back to on-demand.', error)
    return []
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const piece = await getPiece(slug, false)
  if (!piece) return {}

  return {
    title: piece.title,
    description: piece.deck ?? undefined,
  }
}

async function getPiece(slug: string, draft: boolean) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pieces',
    where: { slug: { equals: slug } },
    depth: 3,
    limit: 1,
    draft,
    // Anonymous requests are already limited to published work by the
    // collection's access control; overrideAccess:false keeps that true here.
    overrideAccess: draft,
  })
  return docs[0]
}

export default async function PiecePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { isEnabled: isDraft } = await draftMode()

  const piece = await getPiece(slug, isDraft)
  if (!piece) notFound()

  return <PieceArticle initialPiece={piece} />
}
