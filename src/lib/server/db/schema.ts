import { pgTable, text, date, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { ENCRYPTION_KEY } from '$app/env/private'

// encrypt a given str
function encrypt(encrypt_target: Buffer, encryption_key: Buffer): ArrayBuffer {
	if (ENCRYPTION_KEY.length < 32) {
		throw new Error("Misconfigured key (too short)")
	}
}

// decrypt a given str
function decrypt(decrypt_target: Buffer, encryption_key: Buffer): ArrayBuffer {
	if (ENCRYPTION_KEY.length < 32) {
		throw new Error("Misconfigured key (too short)")
	}
}

function fromHex(convert_target: ArrayBuffer) {
	return Array.from(new Uint8Array(convert_target), (b) => b.toString(16).padStart(2, '0')).join('');
}

const encryptedText = customType<{ data: string }>({
  dataType() {
    return "text";
  },
  fromDriver(value: unknown) {
    return new TextDecoder().decode(
		decrypt(
			Buffer.from(value as string, 'hex'), 
			Buffer.from(ENCRYPTION_KEY, 'hex')
		)
	);
  },
  toDriver(value: string) {
    return fromHex(encrypt(
      Buffer.from(value, "utf8"),
      Buffer.from(ENCRYPTION_KEY, "hex")
    ));
  },
});

// technically if we want to let people collect tanks we'll store their info or we can send them to MTC site
export const vehicles = pgTable('vehicle', {
	slug: text('slug').primaryKey().notNull(),
	name: text('name').notNull(),
	class: text('class').notNull(),
	role: text('role').notNull(),
	team: text('team').notNull(),
	image: text('image_url'),
	lastSynced: date('last_synced')
});

export const dailyMTCdle = pgTable('daily_mtcdle', {
	date: date('date').primaryKey(),
	vehicleSlug: text('vehicle_slug').references(() => vehicles.slug)
})

// maybe add users? i guess? just for funsies? so we can see what MTCdles someone has solved??
// UUID to keep it secret ig, not like we're storing anything tbh
export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	userHash: text('user_hash'),
	solvedMTCdles: text('vehicle_slug').array().notNull().default(sql`ARRAY[]::text[]`),
});

export const sessions = pgTable('user_sessions', {
	tokenHash: text("token_hash").primaryKey(),
	userId: uuid('user_id').references(() => users.id),
	createdAt: date('created_at').defaultNow(),
	revokeAt: date('revoke_at')
})