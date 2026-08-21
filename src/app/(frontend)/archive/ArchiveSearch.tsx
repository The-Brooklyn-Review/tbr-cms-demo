'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import type { SearchRecord } from '../../../lib/search-index'

/**
 * Scores a query against a haystack with simple fuzzy matching: an exact
 * substring scores highest, then all query words appearing anywhere, then a
 * loose subsequence match (letters in order, gaps allowed) so a typo or a
 * partial name still surfaces something. No external library — the whole
 * archive is a few dozen records, so this runs instantly client-side.
 */
function fuzzyScore(query: string, haystack: string): number {
  if (!query) return 1
  if (haystack.includes(query)) return 100 - (haystack.indexOf(query) > 0 ? 1 : 0)

  const words = query.split(/\s+/).filter(Boolean)
  if (words.length > 1 && words.every((w) => haystack.includes(w))) return 60

  // Subsequence match: every character of the query appears in order.
  let hi = 0
  for (const ch of query) {
    hi = haystack.indexOf(ch, hi)
    if (hi === -1) return 0
    hi += 1
  }
  return 20
}

type Props = { pieces: SearchRecord[] }

const ALL = 'All'

export function ArchiveSearch({ pieces }: Props) {
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState(ALL)
  const [issue, setIssue] = useState(ALL)
  const [contributor, setContributor] = useState(ALL)

  const genres = useMemo(
    () => [ALL, ...Array.from(new Set(pieces.map((p) => p.genre).filter(Boolean))).sort()],
    [pieces],
  )
  const issues = useMemo(
    () => [ALL, ...Array.from(new Set(pieces.map((p) => p.issue).filter(Boolean))).sort()],
    [pieces],
  )
  const contributors = useMemo(
    () => [ALL, ...Array.from(new Set(pieces.flatMap((p) => p.contributors))).sort()],
    [pieces],
  )

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return pieces
      .filter((p) => genre === ALL || p.genre === genre)
      .filter((p) => issue === ALL || p.issue === issue)
      .filter((p) => contributor === ALL || p.contributors.includes(contributor))
      .map((p) => ({ piece: p, score: fuzzyScore(q, p.haystack) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ piece }) => piece)
  }, [pieces, query, genre, issue, contributor])

  const hasFilters = genre !== ALL || issue !== ALL || contributor !== ALL

  return (
    <div className="archive-search">
      <input
        type="search"
        className="search-box"
        placeholder="Search titles, contributors, genres…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search the archive"
      />

      <div className="search-filters">
        <label>
          Genre
          <select value={genre} onChange={(e) => setGenre(e.target.value)}>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label>
          Issue
          <select value={issue} onChange={(e) => setIssue(e.target.value)}>
            {issues.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </label>
        <label>
          Contributor
          <select value={contributor} onChange={(e) => setContributor(e.target.value)}>
            {contributors.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        {(hasFilters || query) && (
          <button
            type="button"
            className="clear-filters"
            onClick={() => {
              setQuery('')
              setGenre(ALL)
              setIssue(ALL)
              setContributor(ALL)
            }}
          >
            Clear
          </button>
        )}
      </div>

      <p className="result-count">
        {results.length} {results.length === 1 ? 'piece' : 'pieces'}
      </p>

      <ul className="piece-list archive-results">
        {results.map((p) => (
          <li key={p.id}>
            <Link href={`/pieces/${p.slug}`}>
              <span className="kicker">
                {p.genre}
                {p.issue ? ` · ${p.issue}` : ''}
              </span>
              <span className="t">{p.title}</span>
              <span className="by">{p.contributors.join(' & ')}</span>
              {p.deck || p.excerpt ? <span className="deck-preview">{p.deck || p.excerpt}</span> : null}
            </Link>
          </li>
        ))}
      </ul>

      {results.length === 0 && (
        <p className="no-results">Nothing matches. Try a different search or clear the filters.</p>
      )}
    </div>
  )
}
