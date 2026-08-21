import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import sharp from 'sharp'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Pieces } from './collections/Pieces'
import { Issues } from './collections/Issues'
import { Contributors } from './collections/Contributors'
import { Artworks } from './collections/Artworks'
import { Genres } from './collections/Genres'
import { Media } from './collections/Media'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Supabase exposes its pooler on two ports, and the choice is not cosmetic:
//
//   :5432  session mode     — one dedicated Postgres backend per *connection*,
//                             held for the connection's whole lifetime, capped
//                             at 15 clients.
//   :6543  transaction mode — a backend is borrowed per *transaction* and
//                             returned immediately.
//
// On Vercel every concurrent lambda instance builds its own pg Pool, so under
// session mode a handful of simultaneous requests exhausts the 15-client cap
// and everything downstream fails with EMAXCONNSESSION. Transaction mode is
// what Supabase documents for serverless, so normalise to it here rather than
// depending on whoever set DATABASE_URL having picked the right port.
//
// Safe for named prepared statements: transaction mode doesn't support them,
// but Payload's drizzle adapter never calls .prepare(), so every statement it
// issues is unnamed. Only Supabase pooler hosts are rewritten — a local or
// direct connection on 5432 is left exactly as-is.
function useTransactionPooler(connectionString: string): string {
  if (!connectionString) return connectionString
  try {
    const url = new URL(connectionString)
    if (url.hostname.endsWith('pooler.supabase.com') && url.port === '5432') {
      url.port = '6543'
      return url.toString()
    }
  } catch {
    // Not a parseable URL — hand it back untouched and let pg report on it.
  }
  return connectionString
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' · The Brooklyn Review',
    },
    livePreview: {
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 390, height: 844 },
        { label: 'Tablet', name: 'tablet', width: 834, height: 1112 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: {
      connectionString: useTransactionPooler(process.env.DATABASE_URL || ''),
      // Transaction mode hands connections back per transaction, so a modest
      // per-instance pool is fine — Payload runs several queries concurrently
      // within one request and starves itself if the pool is too small.
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    },
  }),
  collections: [Pieces, Issues, Contributors, Artworks, Genres, Media, Users],
  secret: process.env.PAYLOAD_SECRET || '',
  sharp,
  plugins: process.env.BLOB_READ_WRITE_TOKEN
    ? [
        vercelBlobStorage({
          collections: { media: true },
          token: process.env.BLOB_READ_WRITE_TOKEN,
          clientUploads: true,
        }),
      ]
    : [],
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
})
