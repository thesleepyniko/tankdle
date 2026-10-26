import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { db } from '#lib/server/db/index.ts'
import { readVehicleImg, saveVehicleImg } from '#lib/server/images.ts'

// const VIEWS = ['perspective', 'front', 'back', 'left', 'right', 'top']

export const GET: RequestHandler = async () => {
    let currMTCdle
    const today = new Date().toISOString().slice(0, 10) 
    try {
        currMTCdle = await db.query.dailyMTCdle.findFirst({
            where: (t, { eq }) => eq(t.date, today), // dateObj is still the curr date here
            with: { vehicle: true }
        })
    } catch {
        error(404, "No image available")
    }

    if (!currMTCdle) {
        error(404, "No MTCdle available")
    }
    
    let file = await readVehicleImg(currMTCdle.vehicleSlug);
    if (!file) {
        await saveVehicleImg(currMTCdle.vehicleSlug)
        file = await readVehicleImg(currMTCdle.vehicleSlug)
        if (!file) {
            error(404, "No image available")
        }
    }

	const now = new Date()
    const midnight = new Date(now)
    midnight.setUTCHours(24, 0, 0, 0)
    const untilMidnight = Math.floor((midnight.getTime() - now.getTime()) / 1000)

    return new Response(new Uint8Array(file), {
            headers: {
                    'Content-Type': 'image/png',
                    'Cache-Control': `private, max-age=${Math.min(3600, untilMidnight)}`,
            },
    })
}