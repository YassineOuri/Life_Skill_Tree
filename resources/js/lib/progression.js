/** Rarity tiers. XP values mirror App\Enums\Rarity (the server sends each node's xp too). */
export const RARITIES = {
    common: { label: 'Common', color: '#9ca3af', xp: 10 },
    rare: { label: 'Rare', color: '#3b82f6', xp: 25 },
    epic: { label: 'Epic', color: '#a855f7', xp: 50 },
    legendary: { label: 'Legendary', color: '#f59e0b', xp: 100 },
}

export const rarityOf = key => RARITIES[key] ?? RARITIES.common

/** Progress (0–100) through the current level, from a {xp, floor, next} progression object. */
export function levelPercent({ xp, floor, next }) {
    return next > floor ? Math.round(((xp - floor) / (next - floor)) * 100) : 0
}

/** Quest step progress of a skill: { done, total, percent }. */
export function stepProgress(node) {
    const total = node.steps?.length ?? 0
    const done = node.steps?.filter(s => s.done_at).length ?? 0
    return { done, total, percent: total ? Math.round((done / total) * 100) : 0 }
}
