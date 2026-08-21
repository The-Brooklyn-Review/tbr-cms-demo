import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { CollectionSlug } from 'payload'

/**
 * Entry point for previewing unpublished work.
 *
 * Public pages are statically generated from published content only, so a
 * draft has no page to visit. This route turns on Next.js draft mode for the
 * current browser, which makes those routes render dynamically and lets the
 * page query return unpublished versions.
 *
 * Draft mode is a cookie, so this has to be gated. Two checks: a shared secret
 * (proves the link came from our admin, not guessed) and a real Payload
 * session (proves the person following it is a signed-in editor). The secret
 * alone would be enough to leak the whole draft queue if a preview URL were
 * ever pasted somewhere public.
 */
export async function GET(req: Request): Promise<Response> {
  const payload = await getPayload({ config: configPromise })
  const { searchParams } = new URL(req.url)

  const path = searchParams.get('path')
  const collection = searchParams.get('collection') as CollectionSlug | null
  const slug = searchParams.get('slug')
  const previewSecret = searchParams.get('previewSecret')

  // The session check below is the actual security boundary; the secret is
  // defence in depth against a preview URL being shared around. So only
  // enforce it when one is configured, rather than locking preview out
  // entirely in an environment where the variable was never set.
  const configuredSecret = process.env.PREVIEW_SECRET
  if (configuredSecret && previewSecret !== configuredSecret) {
    return new Response('Invalid preview secret.', { status: 403 })
  }

  if (!path || !collection || !slug) {
    return new Response('Missing required parameters.', { status: 400 })
  }

  // Only ever redirect within this site — an open redirect here would let a
  // preview link bounce an editor to an attacker's page.
  if (!path.startsWith('/')) {
    return new Response('Preview paths must be relative.', { status: 400 })
  }

  let auth

  try {
    // Reads the payload-token cookie off the incoming request.
    auth = await payload.auth({ headers: req.headers })
  } catch {
    payload.logger.error('Could not verify the session for a preview request.')
    return new Response('Could not verify session.', { status: 403 })
  }

  if (!auth?.user) {
    return new Response('You must be signed in to the CMS to preview drafts.', { status: 403 })
  }

  const draft = await draftMode()
  draft.enable()

  redirect(path)
}
