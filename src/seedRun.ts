import { getPayload } from 'payload'
import config from './payload.config'
import { seed } from './seed'

const run = async () => {
  console.log('[seed] booting payload…')
  const payload = await getPayload({ config })
  console.log('[seed] payload ready')

  const existing = await payload.find({ collection: 'users', limit: 1 })
  if (existing.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      data: {
        name: 'TBR Demo Editor',
        email: 'editor@thebrooklynreview.demo',
        password: 'brooklyn2026',
        role: 'editor',
      },
    })
    console.log('[seed] created demo editor account')
  }

  const pieces = await payload.find({ collection: 'pieces', limit: 1 })
  if (pieces.totalDocs > 0) {
    console.log('[seed] content already present — skipping')
    process.exit(0)
  }

  await seed(payload)
  console.log('[seed] done')
  process.exit(0)
}

run().catch((err) => {
  console.error('[seed] FAILED:', err)
  process.exit(1)
})
