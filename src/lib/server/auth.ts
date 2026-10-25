import { db } from "./db";
import { sessions } from "./db/schema";
import { eq, and, gt } from "drizzle-orm";

export async function generateToken(user_uuid: string) { // we don't need to verify here since thats the job of the login func
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const hash = await window.crypto.subtle.digest("SHA-256", bytes);
    const hashStr = new TextDecoder().decode(hash)


    await db.insert(sessions)
        .values({
            tokenHash: hashStr,
            userId: user_uuid,
            revokeAt: new Date(new Date().getTime() + (7 * 24 * 60 * 60 * 1000))
        })
    
    return new TextDecoder().decode(bytes)
}

export async function revokeToken(token: string) {
    const hash = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));

    const deleted_session = await db.delete(sessions)
        .where(eq(sessions.tokenHash, Buffer.from(hash).toString('hex')))
        .returning();
    
    return deleted_session
}

export async function validateToken(token: string): Promise<{ userId: string } | null> {
	const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
	const tokenHash = Buffer.from(hash).toString('hex')

	const [session] = await db
		.select({ userId: sessions.userId })
		.from(sessions)
		.where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.revokeAt, new Date())))
		.limit(1)

	return session ?? null
}

export async function beginDiscordAuth() {

}

// async function createUser(passwordHash) {
    
// }