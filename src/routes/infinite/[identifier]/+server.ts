import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { decrypt } from '#lib/server/encryption.ts'
import { readVehicleImg, saveVehicleImg } from '#lib/server/images.ts'
import type { PuzzleToken } from '#lib/server/types/puzzleToken.js'

// const VIEWS = ['perspective', 'front', 'back', 'left', 'right', 'top']

export const GET: RequestHandler = async ({ params }) => {
    let puzzle: PuzzleToken

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

    let file = await readVehicleImg(puzzle.slug);
    if (!file) {
        await saveVehicleImg(puzzle.slug)
        file = await readVehicleImg(puzzle.slug)
        if (!file) {
            error(404, "No image available")
        }
    }
    

	return new Response(new Uint8Array(file), {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'private, max-age=86400',
		},
	})
}