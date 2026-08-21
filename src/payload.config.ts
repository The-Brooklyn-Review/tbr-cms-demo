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
      connectionString: process.env.DATABASE_URL || '',
      // Supabase's session pooler caps total clients at 15. Each serverless
      // function instance opens its own pool, so this must stay small or
      // concurrent instances exhaust it (EMAXCONNSESSION) — but Payload
      // issues concurrent queries within a single request, so max:1
      // deadlocks (a query waits on a connection held by a sibling query in
      // the same request that can't finish until the first one does).
      max: 3,
      idleTimeoutMillis: 5000,
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
