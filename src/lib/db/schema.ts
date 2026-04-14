import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const tracks = sqliteTable('tracks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  coverUrl: text('cover_url'),
  filePath: text('file_path').notNull(),
  source: text('source', { enum: ['local', 'hitmotop'] }).notNull().default('local'),
  duration: real('duration'),
  mimeType: text('mime_type').default('audio/mpeg'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const userTracks = sqliteTable('user_tracks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  trackId: integer('track_id').notNull().references(() => tracks.id, { onDelete: 'cascade' }),
  liked: integer('liked', { mode: 'boolean' }).notNull().default(false),
  addedAt: integer('added_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const playlists = sqliteTable('playlists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  coverUrl: text('cover_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const playlistTracks = sqliteTable('playlist_tracks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  playlistId: integer('playlist_id').notNull().references(() => playlists.id, { onDelete: 'cascade' }),
  trackId: integer('track_id').notNull().references(() => tracks.id, { onDelete: 'cascade' }),
  position: integer('position').notNull().default(0),
})

export type User = typeof users.$inferSelect
export type Track = typeof tracks.$inferSelect
export type UserTrack = typeof userTracks.$inferSelect
export type Playlist = typeof playlists.$inferSelect
export type PlaylistTrack = typeof playlistTracks.$inferSelect
