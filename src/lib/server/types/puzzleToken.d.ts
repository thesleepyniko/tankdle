export type PuzzleToken =
    | { v: 1; mode: 'daily'; date: string; user: string; }
    | { v: 1; mode: 'infinite'; slug: string; game: string; createdAt: number; user: string; }