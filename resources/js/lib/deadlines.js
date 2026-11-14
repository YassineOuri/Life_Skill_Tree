const DAY_MS = 24 * 60 * 60 * 1000
export const SOON_DAYS = 14

/** Whole days from today (local time) to a 'YYYY-MM-DD' date; negative when past. */
export function daysUntil(isoDate, today = new Date()) {
    const [y, m, d] = isoDate.split('-').map(Number)
    const start = new Date(today)
    start.setHours(0, 0, 0, 0)
    return Math.round((new Date(y, m - 1, d) - start) / DAY_MS)
}

/**
 * Deadline of an open skill: { kind: 'overdue' | 'soon' | 'later', days } or null
 * (no target date, or already completed).
 */
export function deadlineState(node, today = new Date()) {
    if (!node.target_date || node.status === 'completed') return null
    const days = daysUntil(node.target_date, today)
    if (days < 0) return { kind: 'overdue', days: -days }
    return { kind: days <= SOON_DAYS ? 'soon' : 'later', days }
}

export function deadlineLabel(state) {
    if (!state) return null
    const plural = n => (n === 1 ? 'day' : 'days')
    if (state.kind === 'overdue') return `${state.days} ${plural(state.days)} overdue`
    if (state.days === 0) return 'Due today'
    return `${state.days} ${plural(state.days)} left`
}

export const DEADLINE_COLORS = { overdue: '#ef4444', soon: '#f59e0b', later: 'var(--color-parchment-dim)' }
