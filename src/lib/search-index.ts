import type { SerializedEditorState, SerializedLexicalNode } from '@payloadcms/richtext-lexical/lexical'

/**
 * Flattens a Lexical document into plain text, including the text fields of
 * our custom blocks (verse lines, epigraph text, pull quotes). Search only
 * needs words to match against, not structure.
 */
function extractText(node: any): string {
  if (!node) return ''

  if (typeof node.text === 'string') return node.text

  const parts: string[] = []

  if (node.type === 'block' && node.fields) {
    const f = node.fields
    if (typeof f.lines === 'string') parts.push(f.lines)
    if (typeof f.text === 'string') parts.push(f.text)
    if (typeof f.attribution === 'string') parts.push(f.attribution)
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) parts.push(extractText(child))
  }

  return parts.join(' ')
}

export function richTextToPlainText(data: SerializedEditorState | null | undefined): string {
  if (!data?.root) return ''
  return extractText(data.root as unknown as SerializedLexicalNode)
    .replace(/\s+/g, ' ')
    .trim()
}

export type SearchRecord = {
  id: number
  title: string
  slug: string
  deck: string
  excerpt: string
  genre: string
  genreSlug: string
  issue: string
  issueSlug: string
  year: number | null
  season: string
  contributors: string[]
  /** Everything above, lowercased and joined — what the search box matches against. */
  haystack: string
}

const asObj = (v: unknown): any => (v && typeof v === 'object' ? v : null)

export function pieceToSearchRecord(piece: any): SearchRecord | null {
  if (!piece?.title || !piece?.slug) return null

  const genre = asObj(piece.genre)
  const issue = asObj(piece.issue)
  const contributors = (Array.isArray(piece.contributors) ? piece.contributors : [])
    .map((c: any) => asObj(c)?.name)
    .filter(Boolean)

  const excerpt = richTextToPlainText(piece.body).slice(0, 280)

  const haystack = [
    piece.title,
    piece.deck,
    excerpt,
    genre?.name,
    issue?.title,
    ...contributors,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return {
    id: piece.id,
    title: piece.title,
    slug: piece.slug,
    deck: piece.deck || '',
    excerpt,
    genre: genre?.name || '',
    genreSlug: genre?.slug || '',
    issue: issue?.title || '',
    issueSlug: issue?.slug || '',
    year: issue?.year ?? null,
    season: issue?.season || '',
    contributors,
    haystack,
  }
}
