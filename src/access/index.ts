import type { Access, FieldAccess } from 'payload'

/**
 * Access control for the public site and the CMS.
 *
 * The rule that matters most: the public API must never hand out unpublished
 * work. Payload's REST/GraphQL endpoints are open to the internet on the same
 * domain as the site, so an `access.read` of `() => true` on a drafted
 * collection means anyone can fetch tomorrow's issue from /api/pieces today.
 *
 * Two roles today:
 *   editor — the working editorial staff. Full content rights: draft,
 *            publish, delete pieces and taxonomy. Cannot manage accounts.
 *   admin  — everything editor can do, plus managing user accounts and
 *            roles. Reserved for the managing editor and the maintainer.
 * A narrower one-off contributor role (guest editor, scoped to their own
 * piece, no publish) is a real future need but isn't built — it needs a
 * piece-ownership field to scope by, not just a role check.
 */

/** Fully public — safe for taxonomy and published reference data. */
export const anyone: Access = () => true

/** Any signed-in CMS user, regardless of role. */
export const authenticated: Access = ({ req: { user } }) => Boolean(user)

/** Admins only — account management, not routine editorial work. */
export const adminOnly: Access = ({ req: { user } }) => user?.role === 'admin'

/** Either working role. Both can publish; there's no draft-only tier today. */
export const staff: Access = ({ req: { user } }) =>
  user?.role === 'admin' || user?.role === 'editor'

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

/** A user may read or edit their own record; admins may manage everyone. */
export const selfOrAdmin: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.role === 'admin') return true
  return { id: { equals: user.id } }
}

/** Only an admin can change a user's role — otherwise anyone self-promotes. */
export const adminOnlyField: FieldAccess = ({ req: { user } }) => user?.role === 'admin'
