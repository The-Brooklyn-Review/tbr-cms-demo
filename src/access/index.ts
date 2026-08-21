import type { Access, FieldAccess } from 'payload'

/**
 * Access control for the public site and the CMS.
 *
 * The rule that matters most: the public API must never hand out unpublished
 * work. Payload's REST/GraphQL endpoints are open to the internet on the same
 * domain as the site, so an `access.read` of `() => true` on a drafted
 * collection means anyone can fetch tomorrow's issue from /api/pieces today.
 */

/** Fully public — safe for taxonomy and published reference data. */
export const anyone: Access = () => true

/** Any signed-in CMS user, regardless of role. */
export const authenticated: Access = ({ req: { user } }) => Boolean(user)

/** Editors only. Readers can draft but never publish or delete. */
export const editorOnly: Access = ({ req: { user } }) => user?.role === 'editor'

/**
 * Published work is public; drafts are visible only to signed-in users.
 *
 * Returning a query constraint rather than a boolean lets Payload apply this
 * per-document, so a single request can return published pieces to an
 * anonymous reader while hiding the drafts sitting alongside them.
 */
export const publishedOrSignedIn: Access = ({ req: { user } }) => {
  if (user) return true
  return {
    _status: {
      equals: 'published',
    },
  }
}

/** A user may read or edit their own record; editors may manage everyone. */
export const selfOrEditor: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.role === 'editor') return true
  return { id: { equals: user.id } }
}

/** Only editors can change a user's role — otherwise readers self-promote. */
export const editorOnlyField: FieldAccess = ({ req: { user } }) => user?.role === 'editor'
