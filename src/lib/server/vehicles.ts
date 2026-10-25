import type { VehiclesSchema} from '#lib/server/types/vehicles.d.ts'
import { db } from '#lib/server/db/index.ts'
import { sql, min } from 'drizzle-orm'
import { vehicles } from '#lib/server/db/schema.ts'
import { date } from 'drizzle-orm/pg-core'
const BUCKET_URL = "https://public-stats-data.multicrew.dev/production/1.0.0/vehicles.json"
export enum GameType {
    MTC = "95721658376580",
    RAINY_VALLEY = "116683624874765"
}
export async function refreshVehicles(game: GameType) {
    const response = await fetch(BUCKET_URL)
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`)
    }

    const result: VehiclesSchema = await response.json()

    const place = result.data[game] // GameType enum

    const rows = Object.values(place.data).map((vehicle) => ({
        slug: vehicle.info.slug,
        name: place.metadata.slugs[vehicle.info.slug],
        class: vehicle.info.class,
        role: vehicle.info.role,
        team: vehicle.info.team,
        image: `https://cdn.astrid.ovh/public-stats-images/${vehicle.info.slug}/perspective.png`,
        // lastSynced: new Date().toISOString().slice(0, 10)
    }))

    await db
        .insert(vehicles)
        .values(rows)
        .onConflictDoUpdate({
            target: vehicles.slug,
            set: {
                name: sql`excluded.name`,
                class: sql`excluded.class`,
                role: sql`excluded.role`,
                team: sql`excluded.team`,
                image: sql`excluded.image`,
                // lastSynced: sql`excluded.last_synced`
            }
        })
}

export async function refreshVehiclesIfStale(game: GameType) {
    // const [oldest_date] = await db.select({ value: min(vehicles.lastSynced) }).from(vehicles);


}