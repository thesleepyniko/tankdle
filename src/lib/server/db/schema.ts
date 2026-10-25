import { pgTable, text, timestamp, uuid, integer, date, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// technically if we want to let people collect tanks we'll store their info or we can send them to MTC site
export const vehicles = pgTable('vehicle', {
	slug: text('slug').primaryKey().notNull(),
	name: text('name').notNull(),
	class: text('class').notNull(),
	role: text('role').notNull(),
	team: text('team').notNull(),
	image: text('image_url'), // we may want to just find a file on disk via slug
	archivedAt: timestamp('archived_at', { withTimezone: true }) // free history i spose
});

export const rainyValleyVehicles = pgTable('rainyValleyVehicle', {
	slug: text('slug').primaryKey().notNull(),
	name: text('name').notNull(),
	class: text('class').notNull(),
	role: text('role').notNull(),
	team: text('team').notNull(),
	image: text('image_url').notNull(),
	archivedAt: timestamp('archived_at', { withTimezone: true })
});

export const dailyMTCdle = pgTable('daily_mtcdle', {
	date: date('date').primaryKey(),
	puzzleId: integer('puzzleId').generatedAlwaysAsIdentity(),
	vehicleSlug: text('vehicle_slug').references(() => vehicles.slug).notNull()
})

export const vehicleMetadata = pgTable('vehicle_metadata', {
	game: text('game').primaryKey(),
	lastSynced: timestamp('last_synced', { withTimezone: true }).defaultNow()
})

// maybe add users? i guess? just for funsies? so we can see what MTCdles someone has solved??
export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	discordId: text('discord_id').notNull().unique(),
	username: text('username').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const solves = pgTable('solves', {
	userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
	date: date('date').references(() => dailyMTCdle.date).notNull(),
	guesses: integer('guesses').notNull(),
	solvedAt: timestamp('solved_at', { withTimezone: true })
}, (t) => [primaryKey({ columns: [t.userId, t.date] })])

export const sessions = pgTable('user_sessions', {
	tokenHash: text("token_hash").primaryKey(),
	userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	revokeAt: timestamp('revoke_at', { withTimezone: true }).notNull()
})

export const dailyMTCdleRelations = relations(dailyMTCdle, ({ one }) => ({
	vehicle: one(vehicles, {
		fields: [dailyMTCdle.vehicleSlug],
		references: [vehicles.slug]
	})
}))