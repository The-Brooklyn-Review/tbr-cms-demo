import type { CollectionConfig } from 'payload'
import { adminOnly, adminOnlyField, selfOrAdmin } from '../access'

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
    read: selfOrAdmin,
    // Only an admin creates accounts — an editor shouldn't be able to add
    // logins for other people, even though they can publish freely.
    create: adminOnly,
    update: selfOrAdmin,
    delete: adminOnly,
    admin: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Admin — manages accounts, plus everything an editor can do', value: 'admin' },
        { label: 'Editor — can draft, publish, and delete pieces', value: 'editor' },
      ],
      // Without this an editor could edit their own record and promote
      // themselves to admin.
      access: { update: adminOnlyField },
      admin: {
        description: 'Editors handle day-to-day publishing. Admins additionally manage accounts.',
      },
    },
  ],
}
