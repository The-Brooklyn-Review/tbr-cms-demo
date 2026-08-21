import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pieces_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pieces_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_issues_season" AS ENUM('Spring', 'Summer', 'Fall', 'Winter');
  CREATE TYPE "public"."enum_contributors_roles" AS ENUM('Writer', 'Artist', 'Translator', 'Editor');
  CREATE TYPE "public"."enum_users_role" AS ENUM('editor', 'reader');
  CREATE TABLE "pieces" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"genre_id" integer,
  	"issue_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"featured" boolean,
  	"deck" varchar,
  	"body" jsonb,
  	"accent_color" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pieces_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "pieces_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"contributors_id" integer,
  	"artworks_id" integer,
  	"pieces_id" integer
  );
  
  CREATE TABLE "_pieces_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_genre_id" integer,
  	"version_issue_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_featured" boolean,
  	"version_deck" varchar,
  	"version_body" jsonb,
  	"version_accent_color" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pieces_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_pieces_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"contributors_id" integer,
  	"artworks_id" integer,
  	"pieces_id" integer
  );
  
  CREATE TABLE "issues" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"season" "enum_issues_season" NOT NULL,
  	"year" numeric NOT NULL,
  	"cover_artwork_id" integer,
  	"editors_note" jsonb,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "contributors_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_contributors_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "contributors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"bio" jsonb,
  	"photo_id" integer,
  	"website" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "artworks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"image_id" integer NOT NULL,
  	"artist_id" integer,
  	"medium" varchar,
  	"year" varchar,
  	"dimensions" varchar,
  	"credit" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "genres" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" "enum_users_role" DEFAULT 'reader' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pieces_id" integer,
  	"issues_id" integer,
  	"contributors_id" integer,
  	"artworks_id" integer,
  	"genres_id" integer,
  	"media_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "pieces" ADD CONSTRAINT "pieces_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pieces" ADD CONSTRAINT "pieces_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pieces_rels" ADD CONSTRAINT "pieces_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pieces"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pieces_rels" ADD CONSTRAINT "pieces_rels_contributors_fk" FOREIGN KEY ("contributors_id") REFERENCES "public"."contributors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pieces_rels" ADD CONSTRAINT "pieces_rels_artworks_fk" FOREIGN KEY ("artworks_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pieces_rels" ADD CONSTRAINT "pieces_rels_pieces_fk" FOREIGN KEY ("pieces_id") REFERENCES "public"."pieces"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pieces_v" ADD CONSTRAINT "_pieces_v_parent_id_pieces_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pieces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pieces_v" ADD CONSTRAINT "_pieces_v_version_genre_id_genres_id_fk" FOREIGN KEY ("version_genre_id") REFERENCES "public"."genres"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pieces_v" ADD CONSTRAINT "_pieces_v_version_issue_id_issues_id_fk" FOREIGN KEY ("version_issue_id") REFERENCES "public"."issues"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pieces_v_rels" ADD CONSTRAINT "_pieces_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pieces_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pieces_v_rels" ADD CONSTRAINT "_pieces_v_rels_contributors_fk" FOREIGN KEY ("contributors_id") REFERENCES "public"."contributors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pieces_v_rels" ADD CONSTRAINT "_pieces_v_rels_artworks_fk" FOREIGN KEY ("artworks_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pieces_v_rels" ADD CONSTRAINT "_pieces_v_rels_pieces_fk" FOREIGN KEY ("pieces_id") REFERENCES "public"."pieces"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "issues" ADD CONSTRAINT "issues_cover_artwork_id_artworks_id_fk" FOREIGN KEY ("cover_artwork_id") REFERENCES "public"."artworks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contributors_roles" ADD CONSTRAINT "contributors_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."contributors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contributors" ADD CONSTRAINT "contributors_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "artworks" ADD CONSTRAINT "artworks_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "artworks" ADD CONSTRAINT "artworks_artist_id_contributors_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."contributors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pieces_fk" FOREIGN KEY ("pieces_id") REFERENCES "public"."pieces"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_issues_fk" FOREIGN KEY ("issues_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contributors_fk" FOREIGN KEY ("contributors_id") REFERENCES "public"."contributors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_artworks_fk" FOREIGN KEY ("artworks_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_genres_fk" FOREIGN KEY ("genres_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "pieces_slug_idx" ON "pieces" USING btree ("slug");
  CREATE INDEX "pieces_genre_idx" ON "pieces" USING btree ("genre_id");
  CREATE INDEX "pieces_issue_idx" ON "pieces" USING btree ("issue_id");
  CREATE INDEX "pieces_updated_at_idx" ON "pieces" USING btree ("updated_at");
  CREATE INDEX "pieces_created_at_idx" ON "pieces" USING btree ("created_at");
  CREATE INDEX "pieces__status_idx" ON "pieces" USING btree ("_status");
  CREATE INDEX "pieces_rels_order_idx" ON "pieces_rels" USING btree ("order");
  CREATE INDEX "pieces_rels_parent_idx" ON "pieces_rels" USING btree ("parent_id");
  CREATE INDEX "pieces_rels_path_idx" ON "pieces_rels" USING btree ("path");
  CREATE INDEX "pieces_rels_contributors_id_idx" ON "pieces_rels" USING btree ("contributors_id");
  CREATE INDEX "pieces_rels_artworks_id_idx" ON "pieces_rels" USING btree ("artworks_id");
  CREATE INDEX "pieces_rels_pieces_id_idx" ON "pieces_rels" USING btree ("pieces_id");
  CREATE INDEX "_pieces_v_parent_idx" ON "_pieces_v" USING btree ("parent_id");
  CREATE INDEX "_pieces_v_version_version_slug_idx" ON "_pieces_v" USING btree ("version_slug");
  CREATE INDEX "_pieces_v_version_version_genre_idx" ON "_pieces_v" USING btree ("version_genre_id");
  CREATE INDEX "_pieces_v_version_version_issue_idx" ON "_pieces_v" USING btree ("version_issue_id");
  CREATE INDEX "_pieces_v_version_version_updated_at_idx" ON "_pieces_v" USING btree ("version_updated_at");
  CREATE INDEX "_pieces_v_version_version_created_at_idx" ON "_pieces_v" USING btree ("version_created_at");
  CREATE INDEX "_pieces_v_version_version__status_idx" ON "_pieces_v" USING btree ("version__status");
  CREATE INDEX "_pieces_v_created_at_idx" ON "_pieces_v" USING btree ("created_at");
  CREATE INDEX "_pieces_v_updated_at_idx" ON "_pieces_v" USING btree ("updated_at");
  CREATE INDEX "_pieces_v_latest_idx" ON "_pieces_v" USING btree ("latest");
  CREATE INDEX "_pieces_v_autosave_idx" ON "_pieces_v" USING btree ("autosave");
  CREATE INDEX "_pieces_v_rels_order_idx" ON "_pieces_v_rels" USING btree ("order");
  CREATE INDEX "_pieces_v_rels_parent_idx" ON "_pieces_v_rels" USING btree ("parent_id");
  CREATE INDEX "_pieces_v_rels_path_idx" ON "_pieces_v_rels" USING btree ("path");
  CREATE INDEX "_pieces_v_rels_contributors_id_idx" ON "_pieces_v_rels" USING btree ("contributors_id");
  CREATE INDEX "_pieces_v_rels_artworks_id_idx" ON "_pieces_v_rels" USING btree ("artworks_id");
  CREATE INDEX "_pieces_v_rels_pieces_id_idx" ON "_pieces_v_rels" USING btree ("pieces_id");
  CREATE UNIQUE INDEX "issues_slug_idx" ON "issues" USING btree ("slug");
  CREATE INDEX "issues_cover_artwork_idx" ON "issues" USING btree ("cover_artwork_id");
  CREATE INDEX "issues_updated_at_idx" ON "issues" USING btree ("updated_at");
  CREATE INDEX "issues_created_at_idx" ON "issues" USING btree ("created_at");
  CREATE INDEX "contributors_roles_order_idx" ON "contributors_roles" USING btree ("order");
  CREATE INDEX "contributors_roles_parent_idx" ON "contributors_roles" USING btree ("parent_id");
  CREATE UNIQUE INDEX "contributors_slug_idx" ON "contributors" USING btree ("slug");
  CREATE INDEX "contributors_photo_idx" ON "contributors" USING btree ("photo_id");
  CREATE INDEX "contributors_updated_at_idx" ON "contributors" USING btree ("updated_at");
  CREATE INDEX "contributors_created_at_idx" ON "contributors" USING btree ("created_at");
  CREATE INDEX "artworks_image_idx" ON "artworks" USING btree ("image_id");
  CREATE INDEX "artworks_artist_idx" ON "artworks" USING btree ("artist_id");
  CREATE INDEX "artworks_updated_at_idx" ON "artworks" USING btree ("updated_at");
  CREATE INDEX "artworks_created_at_idx" ON "artworks" USING btree ("created_at");
  CREATE UNIQUE INDEX "genres_slug_idx" ON "genres" USING btree ("slug");
  CREATE INDEX "genres_updated_at_idx" ON "genres" USING btree ("updated_at");
  CREATE INDEX "genres_created_at_idx" ON "genres" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_pieces_id_idx" ON "payload_locked_documents_rels" USING btree ("pieces_id");
  CREATE INDEX "payload_locked_documents_rels_issues_id_idx" ON "payload_locked_documents_rels" USING btree ("issues_id");
  CREATE INDEX "payload_locked_documents_rels_contributors_id_idx" ON "payload_locked_documents_rels" USING btree ("contributors_id");
  CREATE INDEX "payload_locked_documents_rels_artworks_id_idx" ON "payload_locked_documents_rels" USING btree ("artworks_id");
  CREATE INDEX "payload_locked_documents_rels_genres_id_idx" ON "payload_locked_documents_rels" USING btree ("genres_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pieces" CASCADE;
  DROP TABLE "pieces_rels" CASCADE;
  DROP TABLE "_pieces_v" CASCADE;
  DROP TABLE "_pieces_v_rels" CASCADE;
  DROP TABLE "issues" CASCADE;
  DROP TABLE "contributors_roles" CASCADE;
  DROP TABLE "contributors" CASCADE;
  DROP TABLE "artworks" CASCADE;
  DROP TABLE "genres" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_pieces_status";
  DROP TYPE "public"."enum__pieces_v_version_status";
  DROP TYPE "public"."enum_issues_season";
  DROP TYPE "public"."enum_contributors_roles";
  DROP TYPE "public"."enum_users_role";`)
}
