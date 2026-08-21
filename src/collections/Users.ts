import type { CollectionConfig } from 'payload'
import { editorOnly, editorOnlyField, selfOrEditor } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'System',
    defaultColumns: ['name', 'email', 'role'],
    description: 'Who can log in. Roles decide what they are allowed to change.',
  },
  auth: true,
  access: {
    // Never public: these rows carry email addresses and password hashes.
    read: selfOrEditor,
    create: editorOnly,
    update: selfOrEditor,
    delete: editorOnly,
    admin: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'reader',
      options: [
        { label: 'Editor — can publish anything', value: 'editor' },
        { label: 'Reader — can draft, cannot publish', value: 'reader' },
      ],
      // Without this a Reader could edit their own record and make
      // themselves an Editor.
      access: { update: editorOnlyField },
      admin: {
        description: 'Editors can publish and delete. Readers can draft only.',
      },
    },
  ],
}
