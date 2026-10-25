import { db } from "./db";
import { sessions } from "./db/schema";
import { eq } from "drizzle-orm";

async function generateToken(user_uuid: string) { // we don't need to verify here since thats the job of the login func
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

async function revokeToken(token: string) {
    const hash = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));

    const deleted_session = await db.delete(sessions)
        .where(eq(sessions.tokenHash, new TextDecoder().decode(hash)))
        .returning();
    
    return deleted_session
}

async function validateToken(token: string) {
    const hash = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));

    const dbResult = await db.select({
        revokeAt: sessions.revokeAt,
        createdAt: sessions.createdAt
    }).from(sessions).where(eq(sessions.tokenHash, new TextDecoder().decode(hash))).limit(1)

    if (!dbResult[0]) {
        return {"error": "No matching token"}
    } else if (!dbResult[0].revokeAt) {
        return {"error": "No revocation time"}
    } else if (dbResult[0].revokeAt?.getTime() < new Date().getTime()) {
        return {"error": "Revocation time has passed"}
    } else {
        return dbResult[0]
    }
}

async function beginDiscordAuth() {
    
}

// async function createUser(passwordHash) {
    
// }