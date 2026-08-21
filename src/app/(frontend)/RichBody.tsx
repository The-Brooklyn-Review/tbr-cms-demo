import React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

// Renders the literary blocks the editor can insert, on top of Payload's
// default converters (paragraphs, headings, links, etc.) — passing a plain
// object here instead of merging with defaultConverters replaces the whole
// set and every ordinary paragraph renders as "unknown node".
export function RichBody({ data }: { data: SerializedEditorState }) {
  return (
    <div className="article-body">
      <RichText
        data={data}
        converters={({ defaultConverters }: any) => ({
          ...defaultConverters,
          blocks: {
            ...defaultConverters.blocks,
            verse: ({ node }: any) => <div className="verse">{node.fields.lines}</div>,
            epigraph: ({ node }: any) => (
              <div className="epigraph">
                {node.fields.text}
                {node.fields.attribution ? <span className="attr">— {node.fields.attribution}</span> : null}
              </div>
            ),
            pullQuote: ({ node }: any) => <blockquote className="pullquote">{node.fields.text}</blockquote>,
          },
        })}
      />
    </div>
  )
}
