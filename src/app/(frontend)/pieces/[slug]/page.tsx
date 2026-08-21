import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { PieceArticle } from './PieceArticle'

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

  const piece = docs[0]
  if (!piece) notFound()

  return <PieceArticle initialPiece={piece} />
}
