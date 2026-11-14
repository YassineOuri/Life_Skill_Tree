import { Head, router } from '@inertiajs/react'
import { ArrowLeft, BookOpenText, Check, Clock, Crown } from 'lucide-react'
import { DEADLINE_COLORS, daysUntil, deadlineLabel, SOON_DAYS } from '../../lib/deadlines'
import { getIcon } from '../../lib/icons'
import { levelPercent, rarityOf } from '../../lib/progression'
import { Frame, GameButton, Hex } from '../../Components/ui'

const MONTH = new Intl.DateTimeFormat(undefined, { month: 'long' })
const DAY = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })

/** [{ year, months: [{ month, events }] }] keeping the newest-first order of events. */
function groupByYearAndMonth(events) {
    const years = []
    for (const event of events) {
        const date = new Date(event.date)
        const year = date.getFullYear()
        const month = MONTH.format(date)
        let y = years.at(-1)
        if (y?.year !== year) years.push((y = { year, months: [] }))
        let m = y.months.at(-1)
        if (m?.month !== month) y.months.push((m = { month, events: [] }))
        m.events.push(event)
    }
    return years
}

function Marker({ children, className = '' }) {
    return <div className={`absolute -left-[37px] top-3 flex items-center justify-center ${className}`}>{children}</div>
}

function LevelUp({ event }) {
    return (
        <li className="relative">
            <Marker>
                <span className="diamond metal-gold flex h-6 w-6 items-center justify-center">
                    <Crown size={12} className="text-[var(--on-gold)]" />
                </span>
            </Marker>
            <div style={{ filter: 'drop-shadow(0 0 14px rgb(220 184 92 / 0.45))' }}>
                <Frame cut={14} inset={2} frameClass="metal-gold" faceClass="metal-gold">
                    <div className="flex items-center justify-between px-5 py-3 text-[var(--on-gold)]">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-70">Level up</p>
                            <p className="font-display text-xl font-extrabold uppercase tracking-[0.12em]">Level {event.level} reached</p>
                        </div>
                        <span className="text-sm font-bold">{DAY.format(new Date(event.date))}</span>
                    </div>
                </Frame>
            </div>
        </li>
    )
}

function SkillCompleted({ event }) {
    const Icon = getIcon(event.category.icon)
    const rarity = rarityOf(event.rarity)
    const color = event.category.color
    return (
        <li className="relative">
            <Marker>
                <span className="diamond h-4 w-4" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
            </Marker>
            <Frame
                cut={12}
                inset={2}
                frameClass=""
                style={{ background: `linear-gradient(160deg, ${color}, var(--color-gold-700) 60%, ${color}aa)` }}
                faceStyle={{ background: `radial-gradient(circle at 8% 50%, ${color}40, transparent 55%), var(--stone)` }}
            >
                <div className="flex items-center gap-4 px-4 py-3">
                    <Hex
                        size={46}
                        frameClass="metal-gold"
                        faceStyle={{ background: `radial-gradient(circle at 50% 35%, ${color}, ${color}66 70%, var(--medal-shade))` }}
                    >
                        <Icon size={20} className="text-[var(--on-gold)]" strokeWidth={2.4} />
                    </Hex>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color }}>
                            {event.category.name} · Skill completed
                        </p>
                        <p className="truncate text-lg font-bold leading-tight text-parchment">{event.title}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em]">
                            <span className="diamond h-2 w-2" style={{ background: rarity.color }} />
                            <span style={{ color: rarity.color }}>{rarity.label}</span>
                            <span className="text-gold-500">+{event.xp} XP</span>
                        </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-parchment-dim">{DAY.format(new Date(event.date))}</span>
                </div>
            </Frame>
        </li>
    )
}

function StepDone({ event }) {
    const color = event.category.color
    return (
        <li className="relative">
            <Marker className="!top-1.5">
                <span className="diamond flex h-3.5 w-3.5 items-center justify-center bg-ink-700">
                    <Check size={8} strokeWidth={4} style={{ color }} />
                </span>
            </Marker>
            <div className="flex items-baseline gap-3 py-1 pl-1">
                <p className="min-w-0 flex-1 text-[15px] font-semibold text-parchment-dim">
                    <span className="text-parchment">{event.title}</span>
                    <span className="mx-2 text-ink-600">—</span>
                    quest step of <span style={{ color }}>{event.skill_title}</span>
                </p>
                <span className="shrink-0 text-xs font-bold text-parchment-dim">{DAY.format(new Date(event.date))}</span>
            </div>
        </li>
    )
}

/** Open skills with a target date: overdue first, then soonest. */
function Upcoming({ items }) {
    if (!items.length) return null
    return (
        <section className="mb-12">
            <h2 className="ornament mb-4 font-display text-xl font-extrabold uppercase tracking-[0.25em]">
                <span className="text-gold">Upcoming</span>
            </h2>
            <Frame cut={14} inset={2} frameClass="metal-dark">
                <ul className="divide-y divide-ink-700 px-5 py-2">
                    {items.map(item => {
                        const days = daysUntil(item.target_date)
                        const kind = item.overdue ? 'overdue' : days <= SOON_DAYS ? 'soon' : 'later'
                        const color = DEADLINE_COLORS[kind]
                        return (
                            <li key={item.id} className="flex items-center gap-3 py-2.5">
                                <Clock size={16} style={{ color }} className={kind === 'overdue' ? 'animate-pulse' : ''} />
                                <span className="diamond h-2 w-2 shrink-0" style={{ background: item.category.color }} />
                                <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-parchment">
                                    {item.title}
                                    <span className="ml-2 text-xs font-bold uppercase tracking-wider" style={{ color: item.category.color }}>
                                        {item.category.name}
                                    </span>
                                </span>
                                <span className="text-xs font-bold text-parchment-dim">{item.target_date}</span>
                                <span className="w-32 text-right text-xs font-bold uppercase tracking-wider" style={{ color }}>
                                    {deadlineLabel({ kind, days: Math.abs(days) })}
                                </span>
                            </li>
                        )
                    })}
                </ul>
            </Frame>
        </section>
    )
}

const EVENT_VIEWS = { level_up: LevelUp, skill_completed: SkillCompleted, step_done: StepDone }

export default function Chronicle({ character, events, upcoming = [] }) {
    const years = groupByYearAndMonth(events)

    return (
        <div className="game-canvas min-h-screen">
            <Head title="Chronicle" />

            <header className="stone sticky top-0 z-10 flex items-center gap-4 px-5 py-3">
                <GameButton onClick={() => router.visit('/')}>
                    <ArrowLeft size={16} /> Skill tree
                </GameButton>
                <div className="flex flex-1 items-center justify-center gap-3">
                    <BookOpenText className="text-gold-500" size={22} />
                    <h1 className="text-gold font-display text-2xl font-extrabold uppercase tracking-[0.16em]">Chronicle</h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-36 text-right leading-none">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-600">{character.xp} XP</p>
                        <div className="mt-1.5 h-1.5 bg-ink-700">
                            <div className="metal-gold h-full" style={{ width: `${levelPercent(character)}%` }} />
                        </div>
                    </div>
                    <Hex size={44} frameClass="metal-gold" faceStyle={{ background: 'var(--color-ink-900)' }}>
                        <div className="text-center leading-none">
                            <div className="text-[7px] font-bold tracking-[0.2em] text-gold-600">LV</div>
                            <div className="text-gold font-display text-base font-extrabold">{character.level}</div>
                        </div>
                    </Hex>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
            </header>

            <main className="mx-auto max-w-3xl px-4 py-10">
                <Upcoming items={upcoming} />
                {years.length === 0 ? (
                    <div className="flex flex-col items-center gap-4 py-24 text-center">
                        <Hex size={80} frameClass="metal-gold" faceStyle={{ background: 'var(--color-ink-900)' }}>
                            <BookOpenText size={32} className="text-gold-500" />
                        </Hex>
                        <p className="font-display text-lg tracking-widest text-parchment-dim">Your chronicle is yet to be written.</p>
                        <p className="text-parchment-dim">Complete a skill or a quest step and it will appear here.</p>
                    </div>
                ) : (
                    years.map(({ year, months }) => (
                        <section key={year} className="mb-12">
                            <h2 className="ornament mb-6 font-display text-3xl font-extrabold tracking-[0.2em]">
                                <span className="text-gold">{year}</span>
                            </h2>
                            {months.map(({ month, events: monthEvents }) => (
                                <div key={month} className="mb-8">
                                    <h3 className="mb-3 ml-10 font-display text-sm font-bold uppercase tracking-[0.3em] text-gold-600">{month}</h3>
                                    {/* gold timeline spine */}
                                    <ol className="relative ml-10 space-y-3 border-l-2 border-gold-700/60 pl-7">
                                        {monthEvents.map((event, i) => {
                                            const View = EVENT_VIEWS[event.type]
                                            return View ? <View key={`${event.type}-${event.date}-${i}`} event={event} /> : null
                                        })}
                                    </ol>
                                </div>
                            ))}
                        </section>
                    ))
                )}
            </main>
        </div>
    )
}
