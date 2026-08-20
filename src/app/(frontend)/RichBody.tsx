import React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

// Renders the literary blocks the editor can insert. Verse is the important one:
// it preserves line breaks exactly, so poems never get reflowed like prose.
const blockConverters = {
  blocks: {
    verse: ({ node }: any) => <div className="verse">{node.fields.lines}</div>,
    epigraph: ({ node }: any) => (
      <div className="epigraph">
        {node.fields.text}
        {node.fields.attribution ? <span className="attr">— {node.fields.attribution}</span> : null}
      </div>
    ),
    pullQuote: ({ node }: any) => <blockquote className="pullquote">{node.fields.text}</blockquote>,
  },
}

export function RichBody({ data }: { data: SerializedEditorState }) {
  return (
    <div className="article-body">
      <RichText data={data} converters={blockConverters as any} />
    </div>
  )
}
