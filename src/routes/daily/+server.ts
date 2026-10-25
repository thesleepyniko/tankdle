import { error } from '@sveltejs/kit'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { RequestHandler } from './$types'
import { db } from '#lib/server/db/index.ts'
import { IMAGE_DIR } from '$app/env/private'

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

    const imageDir = env.IMAGE_DIR ?? './data/vehicles'
    const saveDir = path.join(imageDir, currMTCdle.vehicle.slug)
    const finalPath = path.join(saveDir, "perspective.png"); // always use the perspective view
    try {
        const file = await readFile(finalPath);
        return new Response(file, {
			headers: {
				'Content-Type': 'image/png',
				'Cache-Control': 'private, max-age=3600',
			},
		})
    } catch {
        error(404, "No image available")
    }
}