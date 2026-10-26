// i...think we can just fetch it every once in a while here and return early while its still fetching the updated data?
// only need to fetch like once every week afaik since MTC ain't update allat fast

import { db } from '#lib/server/db/index.ts'
import type { PageServerLoad } from './$types'
import { gt, notInArray, sql, eq, and, isNull } from 'drizzle-orm'
import { dailyMTCdle, vehicles, solves } from '#lib/server/db/schema.ts'
import { refreshVehiclesIfStale, GameType } from '#lib/server/vehicles.ts'
import { validateToken } from '#lib/server/auth.ts'
import { decrypt, encrypt } from '#lib/server/encryption.ts'
import { error, fail, type Actions } from '@sveltejs/kit'
import { saveVehicleImg } from '#lib/server/images.ts'
import type { PuzzleToken } from '#lib/server/types/puzzleToken.js'

const MAX_GUESSES = 5
type Vehicle = typeof vehicles.$inferSelect

function compareGuess(guessed: Vehicle, answer: Vehicle) {
    return {
        name: guessed.name,
        correct: answer.slug === guessed.slug,
        class: { value: guessed.class, match: guessed.class === answer.class },
        role:  { value: guessed.role,  match: guessed.role  === answer.role  },
        team:  { value: guessed.team,  match: guessed.team  === answer.team  }
    }
}

async function makeIdentifier(data: PuzzleToken) {
	const encrypted = await encrypt(new TextEncoder().encode(JSON.stringify(data)))
	return Buffer.from(encrypted).toString('base64url')
}

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

    void refreshVehiclesIfStale(GameType.MTC).catch((err) => console.error('Vehicle sync failed:', err))

    const guessable = await db
        .select({ slug: vehicles.slug, name: vehicles.name })
        .from(vehicles)
        .where(isNull(vehicles.archivedAt))
        .orderBy(vehicles.name)

    const options: Record<string, string> = Object.fromEntries(guessable.map((v) => [v.slug, v.name]))
    // const cutoffDate = dateObj
    if (url.searchParams.get('type') === "infinite")  {
        const [pick] = await db
                .select({ slug: vehicles.slug })
                .from(vehicles)
                .where(isNull(vehicles.archivedAt))
                .orderBy(sql`random()`)
                .limit(1)

        if (!pick) {
            error(503, "No vehicles available")
        }

        const data: PuzzleToken = { v: 1, mode: 'infinite', slug: pick.slug, game: GameType.MTC, createdAt: new Date().getTime(), user: userId}
        const identifier = await makeIdentifier(data)
        return { identifier: identifier, vehicles: options}
    } else {
        let currMTCdle = await db.query.dailyMTCdle.findFirst({
            where: (t, { eq }) => eq(t.date, today), // dateObj is still the curr date here
        })
        if (!currMTCdle) {
            const recentSlugs = db
                .select({ slug: dailyMTCdle.vehicleSlug })
                .from(dailyMTCdle)
                .where(gt(dailyMTCdle.date, cutoff)) // dateObj has become the cutoff date here
            const [pick] = await db
                .select()
                .from(vehicles)
                .where(and(notInArray(vehicles.slug, recentSlugs), isNull(vehicles.archivedAt)))
                .orderBy(sql`random()`)
                .limit(1)
            
            if (!pick) {
                // should only happen if our set is small enough
                error(503, "No vehicles eligible for pick")
            }

            await db.insert(dailyMTCdle)
                .values({ date: today, vehicleSlug: pick.slug })
                .onConflictDoNothing()

            // re-read, so everyone gets the winning row
            currMTCdle = await db.query.dailyMTCdle.findFirst({
                where: (t, { eq }) => eq(t.date, today),
            })
            if (!currMTCdle) {
                error(500, "Could not create daily puzzle")
            }

            try {
                await saveVehicleImg(currMTCdle.vehicleSlug)
            } catch (err) {
                console.error('Daily image save failed:', err)
            }
        }

        const data: PuzzleToken = { v: 1, mode: 'daily', date: currMTCdle.date, user: userId}
        const identifier = await makeIdentifier(data)
        return { identifier: identifier, vehicles: options }
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

        const guessable = await db.query.vehicles.findFirst({
            where: (t, {eq, and, isNull}) => and(eq(t.slug, guess), isNull(t.archivedAt))
        });

        if (!guessable) {
            return fail(400, { message: "Not a guessable tank" })
        }

        if (puzzle.mode === 'daily') {
            const yesterdayDate = new Date()
            yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1)
            const yesterday = yesterdayDate.toISOString().slice(0, 10)

            if (puzzle.date < yesterday) {
                return fail(400, { message: 'This puzzle has expired, please reload' })
            }
            const answer = await db.query.dailyMTCdle.findFirst({
                where: (t, { eq }) => eq(t.date, puzzle.date),
                with: { vehicle: true },
            })


            if (!answer) {
                return fail(400, { message: 'Daily puzzle does not exist, please reload' })
            }

            const reveal = {
                name: answer.vehicle.name,
                team: answer.vehicle.team,
                role: answer.vehicle.role,
            };

            let guessCount: number;

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

                const [counted] = await db.insert(solves)                    
                    .values({ userId, date: puzzle.date, guesses: 1 })
                    .onConflictDoUpdate({
                        target: [solves.userId, solves.date],
                        set: { guesses: sql`${solves.guesses} + 1` },
                    })
                    .returning({ guesses: solves.guesses });
                
                guessCount = counted.guesses
            } else {
                guessCount = Number(form.get('guessNumber')) || 0
            }

            const result = compareGuess(guessable, answer.vehicle)

            if (result.correct && userId) {
                await db.update(solves)
                    .set({ solvedAt: new Date() })
                    .where(and(eq(solves.userId, userId), eq(solves.date, puzzle.date)))
            }

            const done = result.correct || guessCount >= MAX_GUESSES
            return { result, answer: done ? reveal : null }

        } 
        if (puzzle.mode === 'infinite') {
            if (Date.now() - puzzle.createdAt > 6 * 60 * 60 * 1000) {
                return fail(400, { message: 'This round has expired, please start a new one' })
            }

            const answer = await db.query.vehicles.findFirst({
                where: (t, { eq }) => eq(t.slug, puzzle.slug)
            })

            if (!answer) {
                return fail(400, { message: 'Puzzle does not exist, please reload' })
            }

            const reveal = {
                name: answer.name,
                team: answer.team,
                role: answer.role,
            };

            const result = compareGuess(guessable, answer)
            const guessCount = Number(form.get('guessNumber')) || 0
            const done = result.correct || guessCount >= MAX_GUESSES
            return { result, answer: done ? reveal : null }
        }

        return fail(400, { message: 'Unsupported puzzle, please reload' })
	} 
} satisfies Actions