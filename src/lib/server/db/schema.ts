/* eslint-disable @typescript-eslint/no-unused-vars */
import { pgTable, text, date, uuid, boolean } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { ENCRYPTION_KEY } from '$app/env/private'

// const encoder = new TextEncoder()
// const decoder = new TextDecoder()

const key = await crypto.subtle.importKey(
	"raw",
	new Uint8Array(Buffer.from(ENCRYPTION_KEY, 'hex')),
	{ name: 'AES-GCM' },
	false,
	['encrypt', 'decrypt']
)

// encrypt a given array of bytes
async function encrypt(encrypt_target: Uint8Array, encryption_key: CryptoKey): Promise<Uint8Array<ArrayBuffer>> {
	if ((encryption_key.algorithm as AesKeyAlgorithm).length < 256) {
		throw new Error("Misconfigured key (too short)")
	}

	const iv = crypto.getRandomValues(new Uint8Array(12));
	const enc = await crypto.subtle.encrypt({name: 'AES-GCM', iv}, encryption_key, new Uint8Array(encrypt_target))
	const final = new Uint8Array(iv.length + enc.byteLength)

	final.set(iv)
	final.set(new Uint8Array(enc), iv.length)
	return final;
}

// decrypt a given array of bytes
async function decrypt(decrypt_target: Uint8Array, encryption_key: CryptoKey): Promise<Uint8Array<ArrayBuffer>> {
	if ((encryption_key.algorithm as AesKeyAlgorithm).length < 256) {
		throw new Error("Misconfigured key (too short)")
	}

	const iv = decrypt_target.slice(0, 12);
	const enc = decrypt_target.slice(12, decrypt_target.length);
	const decrypted = await crypto.subtle.decrypt({name: 'AES-GCM', iv}, encryption_key, new Uint8Array(enc))
	return new Uint8Array(decrypted)
}

// technically if we want to let people collect tanks we'll store their info or we can send them to MTC site
export const vehicles = pgTable('vehicle', {
	slug: text('slug').primaryKey().notNull(),
	name: text('name').notNull(),
	class: text('class').notNull(),
	role: text('role').notNull(),
	team: text('team').notNull(),
	image: text('image_url'), // we may want to just find a file on disk via slug
	archived_at: date('archived_at') // free history i spose
	// lastSynced: date('last_synced').defaultNow()
});

export const rainyValleyVehicles = pgTable('rainyValleyVehicle', {
	slug: text('slug').primaryKey().notNull(),
	name: text('name').notNull(),
	class: text('class').notNull(),
	role: text('role').notNull(),
	team: text('team').notNull(),
	image: text('image_url'),
	archived_at: date('archived_at')
	// lastSynced: date('last_synced').defaultNow()
});

export const dailyMTCdle = pgTable('daily_mtcdle', {
	date: date('date').primaryKey(),
	vehicleSlug: text('vehicle_slug').references(() => vehicles.slug).notNull()
})

export vehicleMetadata = pgTable('vehicle_metadata', {
	game: text('game').primaryKey,
	lastSynced: date('last_synced').defaultNow()
})

// maybe add users? i guess? just for funsies? so we can see what MTCdles someone has solved??
// UUID to keep it secret ig, not like we're storing anything tbh
export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	passwordHash: text('password_hash'),
	solvedMTCdles: text('vehicle_slug').array().notNull().default(sql`ARRAY[]::text[]`),
});

export const sessions = pgTable('user_sessions', {
	tokenHash: text("token_hash").primaryKey(),
	userId: uuid('user_id').references(() => users.id),
	createdAt: date('created_at').defaultNow(),
	revokeAt: date('revoke_at')
})

export const dailyMTCdleRelations = relations(dailyMTCdle, ({ one }) => ({
	vehicle: one(vehicles, {
		fields: [dailyMTCdle.vehicleSlug],
		references: [vehicles.slug]
	})
}))