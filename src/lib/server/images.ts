import { IMAGE_DIR } from '$app/env/private'
import { mkdir, writeFile, rename, readFile } from 'fs/promises'
import path from 'path'

const imageDir = IMAGE_DIR ?? "./data/images"

export function vehiclePathImg(slug: string) {
    return path.join(imageDir, 'vehicles', `${slug}`, 'perspective.png')
}

export async function saveVehicleImg(slug: string, url?: string) {
    let res
    const finalPath = vehiclePathImg(slug)

    if (url) {
        res = await fetch(url)
    } else {
        res = await fetch(`https://cdn.astrid.ovh/public-stats-images/${slug}/perspective.png`)
    }

    if (!res.ok) throw new Error(`Image fetch failed for ${slug}: ${res.status}`)

    const bytes = new Uint8Array(await res.arrayBuffer())

    await mkdir(path.dirname(finalPath), {recursive: true});


    const tempPath = `${finalPath}.tmp`;

    await writeFile(tempPath, bytes);
    await rename(tempPath, finalPath);
}

export async function readVehicleImg(slug: string) {
    let file
    try {
        file = await readFile(vehiclePathImg(slug))
    } catch {
        return null
    }
    return file
}