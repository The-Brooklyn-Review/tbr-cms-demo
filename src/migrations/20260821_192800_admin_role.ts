import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Two confirmed roles going forward: editor (full content rights — draft,
 * publish, delete pieces and taxonomy) and admin (editor rights plus
 * managing accounts). 'reader' is dropped from the selectable options in
 * config, but its enum label is left in place rather than dropped —
 * Postgres can't cheaply remove an enum value, and nothing currently uses
 * it, so there's no data to migrate off of it.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_users_role" ADD VALUE IF NOT EXISTS 'admin';
  `)
  await db.execute(sql`
    ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'editor';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Adding an enum value can't be cleanly reversed in Postgres without
  // recreating the type; left as a no-op since 'admin' being a valid but
  // unused value is harmless.
  await db.execute(sql`
    ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'reader';
  `)
}
