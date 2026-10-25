import { db } from '#lib/server/db/index.ts';
import type { PageServerLoad } from './$types';
import { gt, notInArray, sql } from 'drizzle-orm'
import { dailyMTCdle, vehicles } from '#lib/server/db/schema.ts' 
import { error } from 'console';

export const load: PageServerLoad = async ({ cookies }) => {
    
}