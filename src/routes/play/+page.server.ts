// i...think we can just fetch it every once in a while here and return early while its still fetching the updated data?
// only need to fetch like once every week afaik since MTC ain't update allat fast

import { db } from '#lib/server/db/index.ts';
import type { PageServerLoad } from './$types';
import { gt, notInArray, sql } from 'drizzle-orm'
import { dailyMTCdle, vehicles } from '#lib/server/db/schema.ts' 
import { error } from 'console';

export const load: PageServerLoad = async ({ url }) => {
    const dateObj = new Date()
    const dateString = dateObj.toISOString().slice(0, 10)
    dateObj.setUTCDate(dateObj.getUTCDate() - 30)
    const cutoffDate = dateObj.toISOString().slice(0, 10)
    if (url.searchParams.get('type') === "infinite")  {
        // 
    } else {
        const currMTCdle = await db.query.dailyMTCdle.findFirst({
            where: (t, { eq }) => eq(t.date, dateString),
            with: { vehicle: true }
        })

        if (currMTCdle && currMTCdle.vehicle) {
            return { vehicle: currMTCdle.vehicle }
        } else {
            const recentSlugs = db
                .select({ slug: dailyMTCdle.vehicleSlug })
                .from(dailyMTCdle)
                .where(gt(dailyMTCdle.date, cutoffDate))
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
            
        }
    }
};