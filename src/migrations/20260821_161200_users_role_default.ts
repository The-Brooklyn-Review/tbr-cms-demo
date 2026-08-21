import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * The `users.role` column was created while the config still defaulted new
 * accounts to `editor`. The config now says `reader` — an account should not
 * arrive with publish and delete rights unless someone grants them — but the
 * column default in databases created before this point still says `editor`.
 *
 * The Payload API applies the config default, so this only bites a row
 * inserted without an explicit role (direct SQL, a restored dump, a seed
 * script). Cheap to correct, and it keeps the schema honest about intent.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'reader';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'editor';
  `)
}
