import type { TextField } from 'payload'

/**
 * "Fictional-piece" and "Mathew-thomas " (trailing space, mixed case) both
 * saved fine and only broke later — a link built from the raw value, a route
 * match that's case-sensitive in Postgres. Formatting the slug at save time
 * removes the whole failure class: there's no "malformed but valid" state
 * left for an editor to accidentally publish.
 */
export function formatSlugValue(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * A slug field that fills itself in from `sourceField` when left blank, and
 * reformats whatever an editor types — on blur via the admin component, and
 * again in beforeValidate so the same rule holds for the API and future
 * autosave-only edits that never visit the UI.
 */
export function slugField(sourceField: string, description?: string): TextField {
  const field: TextField = {
    name: 'slug',
    type: 'text',
    required: true,
    unique: true,
    admin: {
      position: 'sidebar',
      description: description || 'Auto-filled from the title above. Edit it only if you need a different URL.',
      components: {
        Field: {
          path: '@/fields/SlugField#SlugField',
          clientProps: { sourceField },
        },
      },
    },
    hooks: {
      beforeValidate: [
        ({ value, data }) => {
          const raw = typeof value === 'string' && value.length > 0 ? value : data?.[sourceField]
          return typeof raw === 'string' ? formatSlugValue(raw) : raw
        },
      ],
    },
  }
  return field
}
