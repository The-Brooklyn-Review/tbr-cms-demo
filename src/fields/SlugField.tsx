'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import { FieldLabel, TextInput, useField, useFormFields } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'
import { formatSlugValue } from './slug'

type Props = TextFieldClientProps & { sourceField?: string }

/**
 * Mirrors the source field (title/name) into a formatted slug until an
 * editor types into the slug box directly, at which point it stops
 * following and just formats what they typed. Either way, what's on screen
 * is always already a valid path segment — there's no "looks fine, breaks
 * later" state to publish.
 */
export function SlugField({ field, path: pathFromProps, sourceField }: Props) {
  const path = pathFromProps || field.name
  const { value, setValue } = useField<string>({ path })
  const sourceValue = useFormFields(([fields]) => (sourceField ? fields[sourceField]?.value : undefined)) as
    | string
    | undefined

  const followingSource = useRef(true)
  const lastAppliedSlug = useRef<string | undefined>(undefined)

  useEffect(() => {
    // A slug that matches what we last auto-filled is still "following" —
    // only manual edits to something else should break the link.
    if (typeof value === 'string' && value.length > 0 && value !== lastAppliedSlug.current) {
      followingSource.current = false
    }
  }, [value])

  useEffect(() => {
    if (!followingSource.current || typeof sourceValue !== 'string') return
    const next = formatSlugValue(sourceValue)
    if (next !== value) {
      lastAppliedSlug.current = next
      setValue(next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceValue])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      followingSource.current = false
      // Formatting on every keystroke, not just on blur, means there's no
      // moment where an invalid value sits in the field waiting to be
      // forgotten and saved as-is.
      const formatted = formatSlugValue(e.target.value)
      lastAppliedSlug.current = formatted
      setValue(formatted)
    },
    [setValue],
  )

  return (
    <div className="field-type text">
      <FieldLabel htmlFor={`field-${path}`} label={field.label} required={field.required} />
      <TextInput path={path} value={value || ''} onChange={handleChange} />
    </div>
  )
}
