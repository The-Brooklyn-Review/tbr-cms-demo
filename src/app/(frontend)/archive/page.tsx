import { getPayload } from 'payload'
import config from '@payload-config'
import { pieceToSearchRecord } from '../../../lib/search-index'
import { ArchiveSearch } from './ArchiveSearch'

// Built once, rebuilt on publish. See hooks/revalidate.ts. The search index
// is just this page's server-rendered data — no separate build step, no
// external search service. It's a fit for a few dozen pieces a year; it
// would need to become a real search index (e.g. Postgres full-text) well
// before it stopped being one.
export const revalidate = false

export const metadata = {
  title: 'Archive — The Brooklyn Review',
  description: 'Search and filter every piece The Brooklyn Review has published.',
}

export default async function ArchivePage() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'pieces',
    where: { _status: { equals: 'published' } },
    depth: 2,
    limit: 1000,
    sort: '-publishedAt',
  })

  const pieces = docs.map(pieceToSearchRecord).filter((p): p is NonNullable<typeof p> => p !== null)

  return (
    <section className="archive-page">
      <h1>Archive</h1>
      <p className="archive-intro">
        {pieces.length} published {pieces.length === 1 ? 'piece' : 'pieces'}. Search by title, contributor,
        genre, or a phrase from the piece itself.
      </p>
      <ArchiveSearch pieces={pieces} />
    </section>
  )
}
