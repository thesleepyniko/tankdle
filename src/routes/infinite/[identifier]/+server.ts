import { error } from '@sveltejs/kit'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { RequestHandler } from './$types'
import { db } from '#lib/server/db/index.ts'
import { IMAGE_DIR } from '$app/env/private'
import { decrypt } from '#lib/server/encryption.ts'

// const VIEWS = ['perspective', 'front', 'back', 'left', 'right', 'top']

export const GET: RequestHandler = async ({ params }) => {
    let puzzle
    let MTCdleResult

    try {
        const bytes = new Uint8Array(Buffer.from(params.identifier, 'base64url')) 
        const decrypted = await decrypt(bytes)                      
        const json = new TextDecoder().decode(decrypted)                  
        puzzle = JSON.parse(json)                                    
    } catch {
        return error(400, "Incorrect identifier")
    }

    if (puzzle.v != 1 || puzzle.mode != "infinite") {
        return error(400, "Incorrect mode")
    }

    const imageDir = IMAGE_DIR ?? './data/vehicles'
    const saveDir = path.join(imageDir, puzzle.slug)
    const finalPath = path.join(saveDir, "perspective.png"); // always use the perspective view
    let file
	try {
		file = await readFile(finalPath)
	} catch {
		try {
			await writeFile(,)
			file = await readFile(filePath)
		} catch {
			error(404, 'No image available')
		}
	}

	return new Response(file, {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'private, max-age=86400',
		},
	})
}