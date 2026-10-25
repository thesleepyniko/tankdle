// i...think we can just fetch it every once in a while here and return early while its still fetching the updated data?
// only need to fetch like once every week afaik since MTC ain't update allat fast

import { db } from '#lib/server/db/index.ts';
import type { PageServerLoad } from './$types';
import { gt, notInArray, sql, eq, and } from 'drizzle-orm'
import { dailyMTCdle, vehicles, solves } from '#lib/server/db/schema.ts' 
import { mkdir, writeFile, rename } from 'node:fs/promises'
import { refreshVehiclesIfStale, GameType } from '#lib/server/vehicles.ts';
import { error } from 'console';
import { IMAGE_DIR } from '$app/env/private'
import path from 'path';
import { validateToken } from '#lib/server/auth.ts';
import { decrypt, encrypt } from '#lib/server/encryption.ts';
import { fail, type Actions } from '@sveltejs/kit';
import { saveVehicleImg } from '#lib/server/images.ts';

type PuzzleToken =
	| { v: 1; mode: 'daily'; date: string; user: string; }
	| { v: 1; mode: 'infinite'; slug: string; game: string; createdAt: number; user: string; }

const MAX_GUESSES = 5

export const load: PageServerLoad = async ({ url, cookies }) => {
    const today = new Date().toISOString().slice(0, 10)   // "2026-10-25"
    const thirtyDays = new Date();
    thirtyDays.setUTCDate(thirtyDays.getUTCDate() - 30);
    const cutoff = thirtyDays.toISOString().slice(0, 10)

    const token = cookies.get('session_token')
    const session = token ? await validateToken(token) : null
    let userId

    if (session) {
        userId = session.userId
    } else {
        userId = "guest"
    }

    // const cutoffDate = dateObj
    if (url.searchParams.get('type') === "infinite")  {
        const [pick] = await db
                .select()
                .from(vehicles)
                .orderBy(sql`random()`)
                .limit(1)
        
        const data: PuzzleToken = { v: 1, mode: 'infinite', slug: pick.slug, game: GameType.MTC, createdAt: new Date().getTime(), user: userId}
        const encrypted = await encrypt(new TextEncoder().encode(JSON.stringify(data))) // prevent the user from just finding the answer
        const identifier = Buffer.from(encrypted).toString('base64url')
        return { identifier: identifier }
    } else {
        const currMTCdle = await db.query.dailyMTCdle.findFirst({
            where: (t, { eq }) => eq(t.date, today), // dateObj is still the curr date here
            with: { vehicle: true }
        })

        if (currMTCdle && currMTCdle.vehicle) {
            const data: PuzzleToken = { v: 1, mode: 'daily', date: currMTCdle.date, user: userId}
            const encrypted = await encrypt(new TextEncoder().encode(JSON.stringify(data))) // prevent the user from just finding the answer
            const identifier = Buffer.from(encrypted).toString('base64url')
            return { identifier: identifier }
        } else {
            const recentSlugs = db
                .select({ slug: dailyMTCdle.vehicleSlug })
                .from(dailyMTCdle)
                .where(gt(dailyMTCdle.date, cutoff)) // dateObj has become the cutoff date here
            const [pick] = await db
                .select()
                .from(vehicles)
                .where(notInArray(vehicles.slug, recentSlugs))
                .orderBy(sql`random()`)
                .limit(1)
            
            if (!pick) {
                // should only happen if our set is small enough
                error(503, "No vehicles eligible for pick")
            }

            if (pick.image) {
                saveVehicleImg(pick.slug, pick.image)
            } else {
                saveVehicleImg(pick.slug)
            }
        }

        refreshVehiclesIfStale(GameType.MTC);
    }
};

export const actions = {
    guess: async ({ request, cookies }) => {		
        const form = await request.formData()
		const guess = form.get('guess')
		const identifier = form.get('identifier')

        if (typeof guess !== 'string' || typeof identifier !== 'string' || !identifier) {
            return fail(400, { message: 'Invalid guess, please reload' })
        }

        let puzzle: PuzzleToken

        try {
            const bytes = new Uint8Array(Buffer.from(identifier, 'base64url')) 
            const decrypted = await decrypt(bytes)                      
            const json = new TextDecoder().decode(decrypted)                  
            puzzle = JSON.parse(json)                                    
        } catch {
            return fail(400, { message: 'Invalid puzzle, please reload' })
        }

        if (puzzle.v !== 1) {
            return fail(400, { message: 'Unsupported puzzle, please reload' })
        }

        const token = cookies.get('session_token')
        const session = token ? await validateToken(token) : null
        const userId = session?.userId ?? null
        if ((userId ?? 'guest') !== puzzle.user) {
            return fail(400, { message: 'Your login changed, please reload' })
        }

        if (puzzle.mode === 'daily') {
            if (puzzle.date < new Date().toISOString().slice(0, 10)) {
                return fail(400, { message: 'This puzzle has expired, please reload' })
            }
            const answer = await db.query.dailyMTCdle.findFirst({
                where: (t, { eq }) => eq(t.date, puzzle.date),
                with: { vehicle: true },
            })

            if (!answer) {
                return fail(400, { message: 'Daily puzzle does not exist, please reload' })
            }

            if (userId) {
                const [existing] = await db
                    .select({ guesses: solves.guesses, solvedAt: solves.solvedAt })
                    .from(solves)
                    .where(and(eq(solves.userId, userId), eq(solves.date, puzzle.date)))
                    .limit(1)

                if (existing?.solvedAt) {
                    return fail(400, { message: 'You already solved this one!' })
                }
                if (existing && existing.guesses >= MAX_GUESSES) {
                    return fail(400, { message: 'No guesses left' })
                }

                await db.insert(solves)
                    .values({ userId, date: puzzle.date, guesses: 1 })
                    .onConflictDoUpdate({
                        target: [solves.userId, solves.date],
                        set: { guesses: sql`${solves.guesses} + 1` },
                    })
            }

            if (answer.vehicleSlug === guess) {
                if (userId) {
                    await db.update(solves)
                        .set({ solvedAt: new Date() })
                        .where(and(eq(solves.userId, userId), eq(solves.date, puzzle.date)))
                }
                return {
                    correct: true,
                    vehicle: {
                        name: answer.vehicle.name,
                        team: answer.vehicle.team,
                        role: answer.vehicle.role,
                    },
                }
            } 

            return { correct: false }
        }
        // type PuzzleToken =
	// | { v: 1; mode: 'daily'; date: string; user: string; }
	// | { v: 1; mode: 'infinite'; slug: string; game: string; createdAt: number }
	} 
} satisfies Actions