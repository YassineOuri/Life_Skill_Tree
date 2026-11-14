import { Handle, Position } from '@xyflow/react'
import { Check, Clock, Link2, Lock } from 'lucide-react'
import { DEADLINE_COLORS, deadlineLabel, deadlineState } from '../lib/deadlines'
import { getIcon } from '../lib/icons'
import { rarityOf, stepProgress } from '../lib/progression'
import { Burst, Frame, Hex } from './ui'

const handleStyle = { opacity: 0, pointerEvents: 'none' }

const STATUS_LABEL = { available: 'Available', in_progress: 'Training', completed: 'Completed' }

const SELECTED_FILTER = 'drop-shadow(0 0 2px #f7e7b4) drop-shadow(0 0 10px #dcb85c)'

function state(node) {
    return {
        locked: node.locked,
        completed: node.status === 'completed',
        inProgress: node.status === 'in_progress',
    }
}

/** Glow per state: steady once completed, pulsing (ember) while training. */
function glowProps(node, color) {
    const { locked, completed, inProgress } = state(node)
    if (locked) return {}
    if (completed) return { style: { filter: `drop-shadow(0 0 8px ${color}aa)` } }
    return { className: inProgress ? 'ember' : '', style: { '--glow': color } }
}

function StatusLine({ node, color, center = false }) {
    const { locked, completed } = state(node)
    return (
        <div
            className={`mt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${center ? 'justify-center' : ''}`}
        >
            <span
                className="diamond inline-block h-1.5 w-1.5"
                style={{ background: locked ? 'var(--color-ink-600)' : completed ? '#dcb85c' : color }}
            />
            <span className={locked ? 'text-ink-600' : completed ? 'text-gold-400' : 'text-parchment-dim'}>
                {locked ? 'Locked' : STATUS_LABEL[node.status]}
            </span>
        </div>
    )
}

/** Diamond gem in the rarity colour. */
function RarityGem({ rarity, className }) {
    const { color, label } = rarityOf(rarity)
    return (
        <span
            title={label}
            className={`diamond absolute flex h-3.5 w-3.5 items-center justify-center ${className}`}
            style={{ background: `linear-gradient(135deg, #fff8 0%, ${color} 45%, ${color} 70%, #0006 100%)`, filter: `drop-shadow(0 0 4px ${color})` }}
        />
    )
}

/** Segmented quest bar for cards. */
function StepBar({ node, color }) {
    const { done, total } = stepProgress(node)
    if (!total || node.status === 'completed') return null
    return (
        <div className="mt-1.5 flex gap-[3px]" title={`${done}/${total} quest steps`}>
            {node.steps.map(step => (
                <span
                    key={step.id}
                    className="h-[3px] flex-1"
                    style={{ background: step.done_at ? color : 'var(--color-ink-700)', boxShadow: step.done_at ? `0 0 4px ${color}` : undefined }}
                />
            ))}
        </div>
    )
}

/** Circular quest progress around a medallion. */
function StepRing({ node, color, size }) {
    const { total, percent } = stepProgress(node)
    if (!total || node.status === 'completed') return null
    const r = size / 2 - 2
    const length = 2 * Math.PI * r
    return (
        <svg
            className="pointer-events-none absolute -rotate-90"
            width={size}
            height={size}
            style={{ left: '50%', top: '50%', marginLeft: -size / 2, marginTop: -size / 2 }}
        >
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-ink-700)" strokeWidth="3" />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(length * percent) / 100} ${length}`}
                style={{ filter: `drop-shadow(0 0 3px ${color})` }}
            />
        </svg>
    )
}

/** Marks prerequisites from other categories (their links only show in the "All" view). */
function ExternalBadge({ external, className }) {
    if (!external?.length) return null
    const done = external.every(e => e.completed)
    const title = external.map(e => `Requires ${e.title} · ${e.category}${e.completed ? ' ✓' : ''}`).join('\n')
    return (
        <span
            title={title}
            className={`diamond absolute flex h-6 w-6 items-center justify-center ${done ? 'metal-gold' : 'metal-dark'} ${className}`}
        >
            <Link2 size={11} strokeWidth={3} className={done ? 'text-[var(--on-gold)]' : 'text-gold-400'} />
        </span>
    )
}

/** Clock badge: red and pulsing when overdue, amber when due within two weeks. */
function DeadlineBadge({ node, className }) {
    const state = deadlineState(node)
    if (!state || state.kind === 'later') return null
    const color = DEADLINE_COLORS[state.kind]
    return (
        <span
            title={`${deadlineLabel(state)} (target ${node.target_date})`}
            className={`diamond absolute flex h-6 w-6 items-center justify-center ${state.kind === 'overdue' ? 'animate-pulse' : ''} ${className}`}
            style={{ background: color, filter: `drop-shadow(0 0 5px ${color})` }}
        >
            <Clock size={11} strokeWidth={3} className="text-white" />
        </span>
    )
}

function CheckBadge({ className }) {
    return (
        <span className={`diamond metal-gold absolute flex h-7 w-7 items-center justify-center ${className}`}>
            <Check size={13} strokeWidth={3.5} className="text-[var(--on-gold)]" />
        </span>
    )
}

function NodeIcon({ node, color, size }) {
    const { locked, completed } = state(node)
    const Icon = getIcon(node.icon)
    if (locked) return <Lock size={size - 2} className="text-ink-600" />
    return <Icon size={size} style={{ color: completed ? 'var(--on-gold)' : color }} strokeWidth={2.25} />
}

/* ---- Card: polygon card with a hex medallion -------------------------------------------- */

function SkillCard({ node, color, burst, external }) {
    const { locked, completed } = state(node)
    const glow = glowProps(node, color)

    const frame = locked
        ? { frameClass: 'metal-dark' }
        : completed
          ? { frameClass: 'metal-gold' }
          : { frameClass: '', style: { background: `linear-gradient(160deg, ${color}, var(--color-gold-700) 60%, ${color}aa)` } }

    const face = completed
        ? {
              background: `radial-gradient(circle at 20% 50%, ${color}55, transparent 65%), linear-gradient(180deg, var(--color-ink-800), var(--color-ink-900))`,
          }
        : undefined

    return (
        <>
            <div className={`h-full w-full ${glow.className ?? ''}`} style={glow.style}>
                <Frame cut={12} inset={2} className="h-full w-full" frameClass={frame.frameClass} style={frame.style} faceStyle={face}>
                    <div className="flex h-full items-center gap-3 pl-2.5 pr-3">
                        <Hex
                            size={48}
                            frameClass={locked ? 'metal-dark' : completed ? 'metal-gold' : ''}
                            frameStyle={!locked && !completed ? { background: color } : undefined}
                            faceStyle={completed ? { background: `radial-gradient(circle, ${color}, ${color}88)` } : undefined}
                        >
                            <NodeIcon node={node} color={color} size={20} />
                        </Hex>
                        <div className="min-w-0 flex-1">
                            <div className="line-clamp-2 text-[14px] font-bold leading-[1.1] text-parchment" title={node.title}>
                                {node.title}
                            </div>
                            <StatusLine node={node} color={color} />
                            <StepBar node={node} color={color} />
                        </div>
                    </div>
                    {/* rarity rim */}
                    <span
                        className="absolute inset-x-3 bottom-0 h-[2px]"
                        style={{ background: `linear-gradient(90deg, transparent, ${rarityOf(node.rarity).color}, transparent)` }}
                    />
                </Frame>
            </div>
            <RarityGem rarity={node.rarity} className="-left-1 -top-1" />
            <ExternalBadge external={external} className="-bottom-2 -right-2" />
            <DeadlineBadge node={node} className="-top-2 left-1/2 -ml-3" />
            {completed && <CheckBadge className="-right-2 -top-2" />}
            {burst && <Burst key={burst} color={completed ? '#eed58a' : color} />}
        </>
    )
}

/* ---- Medallion: round, Tomb Raider style, title underneath ------------------------------ */

function SkillMedallion({ node, color, burst, external }) {
    const { locked, completed } = state(node)
    const glow = glowProps(node, color)

    const ring = locked
        ? { className: 'metal-dark' }
        : completed
          ? { className: 'metal-gold-ring' }
          : {
                style: {
                    background: `conic-gradient(from 210deg, ${color}, var(--color-gold-700), ${color}, #eed58a55, ${color}, var(--color-gold-700), ${color})`,
                },
            }

    const disc = completed
        ? { background: `radial-gradient(circle at 50% 35%, ${color}, ${color}88 60%, var(--medal-shade))` }
        : { background: `radial-gradient(circle at 50% 30%, ${locked ? 'transparent' : `${color}33`}, var(--color-ink-950) 70%)` }

    return (
        <div className="flex h-full flex-col items-center">
            <div className="relative">
                <div className={glow.className} style={glow.style}>
                    <div className={`rounded-full p-[4px] ${ring.className ?? ''}`} style={ring.style}>
                        <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full" style={disc}>
                            {/* engraved inner ring */}
                            <div
                                className="flex h-[58px] w-[58px] items-center justify-center rounded-full border"
                                style={{ borderColor: locked ? 'var(--color-ink-700)' : completed ? '#f7e7b499' : `${color}66` }}
                            >
                                <NodeIcon node={node} color={color} size={28} />
                            </div>
                        </div>
                    </div>
                </div>
                <StepRing node={node} color={color} size={90} />
                <RarityGem rarity={node.rarity} className="-bottom-1.5 left-1/2 -ml-[7px]" />
                <ExternalBadge external={external} className="-bottom-1 -left-2" />
                <DeadlineBadge node={node} className="-left-2 -top-1" />
                {completed && <CheckBadge className="-right-1 -top-1" />}
                {burst && <Burst key={burst} color={completed ? '#eed58a' : color} />}
            </div>
            <div className="mt-2 w-full px-1 text-center">
                <div className="line-clamp-2 text-[13px] font-bold leading-[1.1] text-parchment" title={node.title}>
                    {node.title}
                </div>
                <StatusLine node={node} color={color} center />
            </div>
        </div>
    )
}

export default function SkillNode({ data }) {
    const { node, color, selected, variant, burst, external } = data
    const medallion = variant === 'medallion'

    return (
        <div
            className={`relative transition duration-200 ${medallion ? 'h-[130px] w-[150px]' : 'h-[76px] w-[210px]'} ${
                node.locked ? 'opacity-50 grayscale' : 'cursor-pointer hover:-translate-y-0.5'
            }`}
            style={selected ? { filter: SELECTED_FILTER } : undefined}
        >
            <Handle type="target" position={Position.Top} style={handleStyle} />
            <div key={burst} className={`h-full w-full ${burst ? 'burst-pop' : ''}`}>
                {medallion ? (
                    <SkillMedallion node={node} color={color} burst={burst} external={external} />
                ) : (
                    <SkillCard node={node} color={color} burst={burst} external={external} />
                )}
            </div>
            <Handle type="source" position={Position.Bottom} style={handleStyle} />
        </div>
    )
}
