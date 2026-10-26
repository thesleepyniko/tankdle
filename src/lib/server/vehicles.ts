import type { VehiclesSchema} from '#lib/server/types/vehicles.d.ts'
import { db } from '#lib/server/db/index.ts'
import { sql, eq } from 'drizzle-orm'
import { vehicles, vehicleMetadata } from '#lib/server/db/schema.ts'

const BUCKET_URL = "https://public-stats-data.multicrew.dev/production/1.0.0/vehicles.json";
export enum GameType {
    MTC = "95721658376580",
    RAINY_VALLEY = "116683624874765"
};

export async function refreshVehicles(game: GameType) {
    const response = await fetch(BUCKET_URL);
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    };

    const result: VehiclesSchema = await response.json();

    const place = result.data[game]; // GameType enum

    const rows = Object.values(place.data).map((vehicle) => ({
        slug: vehicle.info.slug,
        name: place.metadata.slugs[vehicle.info.slug],
        class: vehicle.info.class,
        role: vehicle.info.role,
        team: vehicle.info.team,
        image: `https://cdn.astrid.ovh/public-stats-images/${vehicle.info.slug}/perspective.png`,
    }));

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
                image: sql`excluded.image_url`,
            }
        });

    await db
        .insert(vehicleMetadata)
        .values(
            {
                game: game,
                lastSynced: new Date()
            }
        ).onConflictDoUpdate({
            target: vehicleMetadata.game,
            set: {
                lastSynced: sql`excluded.last_synced`
            }
        });
};

export async function refreshVehiclesIfStale(game: GameType) {
    const [last_synced_game] = await db
        .select({lastSynced: vehicleMetadata.lastSynced})
        .from(vehicleMetadata)
        .where(eq(vehicleMetadata.game, game));
    if (!last_synced_game || !last_synced_game.lastSynced) {
        await refreshVehicles(game).catch((err) => console.error('Vehicle sync failed:', err))
    } else {
        if ((new Date().getTime() - last_synced_game.lastSynced?.getTime()) > (30 * 24 * 60 * 60 * 1000)) {
            refreshVehicles(game).catch((err) => console.error('Vehicle sync failed:', err))
        }
    }
}