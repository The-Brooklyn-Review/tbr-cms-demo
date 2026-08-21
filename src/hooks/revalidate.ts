import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Piece } from '../payload-types'

/**
 * Keeps the statically generated site in step with the CMS.
 *
 * Public pages are rendered once and served from the CDN, which is what keeps
 * readers off the database entirely. The tradeoff is that a published change
 * would otherwise sit invisible until the next deploy — so every write marks
 * the affected paths stale and they regenerate on the next request.
 *
 * Revalidating is just cache invalidation, not a site build: it costs
 * effectively nothing, so these hooks err towards clearing too much rather
 * than trying to be clever about which contributor pages a piece touches.
 */

/** The piece's own URL, plus every listing that could mention it. */
const revalidatePieceRoutes = (piece: Partial<Piece>) => {
  if (piece.slug) revalidatePath(`/pieces/${piece.slug}`)
  // Homepage lists everything; contributor pages list each person's work.
  // Revalidating the frontend layout covers both without having to resolve
  // which contributors were attached before and after the edit.
  revalidatePath('/(frontend)', 'layout')
}

export const revalidatePiece: CollectionAfterChangeHook<Piece> = ({
  doc,
  previousDoc,
  req: { context },
}) => {
  if (context?.disableRevalidate) return doc

  // Publishing, or editing something already public, changes the live site.
  if (doc._status === 'published') revalidatePieceRoutes(doc)

  // Unpublishing has to clear the old URL too, or the CDN keeps serving the
  // version that was just retracted.
  if (previousDoc?._status === 'published' && doc._status !== 'published') {
    revalidatePieceRoutes(previousDoc)
  }

  // A renamed slug leaves the old path cached and still reachable.
  if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
    revalidatePath(`/pieces/${previousDoc.slug}`)
  }

  return doc
}

export const revalidatePieceOnDelete: CollectionAfterDeleteHook<Piece> = ({
  doc,
  req: { context },
}) => {
  if (context?.disableRevalidate) return doc
  revalidatePieceRoutes(doc)
  return doc
}

/**
 * Contributors, artworks, genres and issues all surface inside piece pages —
 * bylines, credits, kickers — so editing one can change many rendered pages.
 */
export const revalidateRelatedContent: CollectionAfterChangeHook = ({ doc, req: { context } }) => {
  if (context?.disableRevalidate) return doc
  revalidatePath('/(frontend)', 'layout')
  return doc
}
