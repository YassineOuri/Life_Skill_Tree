import { router } from '@inertiajs/react'
import { CalendarDays, ExternalLink, Lock, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { DEADLINE_COLORS, deadlineLabel, deadlineState } from '../lib/deadlines'
import { getIcon } from '../lib/icons'
import { categoryProgress } from '../lib/layout'
import { rarityOf } from '../lib/progression'
import EvidenceFiles from './EvidenceFiles'
import NodeForm from './NodeForm'
import QuestSteps from './QuestSteps'
import { GameButton, Hex, SectionTitle } from './ui'

const STATUSES = [
    { value: 'available', label: 'Available' },
    { value: 'in_progress', label: 'Training' },
    { value: 'completed', label: 'Completed' },
]

function Shell({ color, title, Icon, subtitle, onClose, children }) {
    return (
        <aside className="absolute right-0 top-0 z-10 flex h-full w-full max-w-sm">
            {/* gold edge */}
            <div className="metal-gold w-[3px] shrink-0" />
            <div className="stone flex min-w-0 flex-1 flex-col bg-ink-900/95 backdrop-blur">
                <header
                    className="relative flex items-center gap-4 p-5"
                    style={{ background: `radial-gradient(ellipse at 0% 50%, ${color}33, transparent 70%)` }}
                >
                    <Hex
                        size={64}
                        frameClass="metal-gold"
                        faceStyle={{ background: `radial-gradient(circle at 50% 35%, ${color}, ${color}55 70%, var(--medal-shade))` }}
                    >
                        <Icon size={26} className="text-[var(--on-gold)]" strokeWidth={2.4} />
                    </Hex>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color }}>
                            {subtitle}
                        </p>
                        <h2 className="text-gold font-display text-xl font-bold leading-tight">{title}</h2>
                    </div>
                    <button onClick={onClose} className="self-start text-parchment-dim hover:text-gold-300" aria-label="Close">
                        <X size={20} />
                    </button>
                </header>
                <div className="mx-5 h-px bg-gradient-to-r from-transparent via-gold-600 to-transparent" />
                <div className="flex-1 space-y-6 overflow-y-auto p-5">{children}</div>
            </div>
        </aside>
    )
}

function statusLabel(node) {
    if (node.status === 'completed') return 'Completed'
    if (node.locked) return 'Locked'
    return node.status === 'in_progress' ? 'Training' : 'Available'
}

/** A related skill (prerequisite or unlock); clicking it selects that skill. */
function SkillLink({ node, onSelect }) {
    const completed = node.status === 'completed'
    return (
        <li>
            <button
                type="button"
                onClick={() => onSelect(node.id)}
                className="flex w-full items-center gap-2 py-0.5 text-left text-[15px] font-semibold text-parchment hover:text-gold-300"
            >
                <span className="diamond h-2 w-2 shrink-0" style={{ background: completed ? '#dcb85c' : 'var(--color-ink-600)' }} />
                <span className="truncate">{node.title}</span>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-parchment-dim">{statusLabel(node)}</span>
            </button>
        </li>
    )
}

export function SkillPanel({ node, category, categories, nodes, onClose, onSelect }) {
    const [mode, setMode] = useState('view')
    const [statusError, setStatusError] = useState(null)
    const Icon = getIcon(node.icon)
    const rarity = rarityOf(node.rarity)
    const prerequisites = nodes.filter(n => node.prerequisite_ids.includes(n.id))
    const unlocks = nodes.filter(n => n.prerequisite_ids.includes(node.id))
    const deadline = deadlineState(node)

    const setStatus = status => {
        setStatusError(null)
        router.patch(`/nodes/${node.id}/status`, { status }, {
            preserveScroll: true,
            onError: errors => setStatusError(errors.status),
        })
    }

    const destroy = () => {
        const extra = unlocks.length ? `\n${unlocks.length} skill(s) require it and will lose this prerequisite.` : ''
        if (!confirm(`Delete "${node.title}"?${extra}`)) return
        router.delete(`/nodes/${node.id}`, { preserveScroll: true, onSuccess: onClose })
    }

    return (
        <Shell color={category.color} title={node.title} Icon={Icon} subtitle={category.name} onClose={onClose}>
            {mode === 'edit' ? (
                <>
                    <SectionTitle>Edit skill</SectionTitle>
                    <NodeForm key={`edit-${node.id}`} node={node} nodes={nodes} categories={categories} onDone={() => setMode('view')} onCancel={() => setMode('view')} />
                </>
            ) : mode === 'add' ? (
                <>
                    <SectionTitle>New branch</SectionTitle>
                    <NodeForm
                        key={`add-${node.id}`}
                        categoryId={node.category_id}
                        prerequisiteIds={[node.id]}
                        nodes={nodes}
                        categories={categories}
                        onDone={() => setMode('view')}
                        onCancel={() => setMode('view')}
                    />
                </>
            ) : (
                <>
                    <div className="-mt-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em]">
                        <span className="diamond h-3 w-3" style={{ background: rarity.color, boxShadow: `0 0 6px ${rarity.color}` }} />
                        <span style={{ color: rarity.color }}>{rarity.label}</span>
                        <span className="text-parchment-dim">· {node.xp} XP</span>
                    </div>

                    {node.description && (
                        <p className="whitespace-pre-line border-l-2 border-gold-700 pl-3 text-[15px] italic leading-snug text-parchment-dim">
                            {node.description}
                        </p>
                    )}

                    <section>
                        <SectionTitle>Status</SectionTitle>
                        {node.locked && (
                            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-500">
                                <Lock size={14} /> Complete all prerequisites to unlock.
                            </p>
                        )}
                        <div className="grid grid-cols-3 gap-2">
                            {STATUSES.map(s => (
                                <GameButton
                                    key={s.value}
                                    active={node.status === s.value}
                                    disabled={node.locked || node.status === s.value}
                                    onClick={() => setStatus(s.value)}
                                >
                                    {s.label}
                                </GameButton>
                            ))}
                        </div>
                        {statusError && <p className="mt-2 text-sm font-semibold text-red-400">{statusError}</p>}
                    </section>

                    <section>
                        <SectionTitle>Quest</SectionTitle>
                        <QuestSteps node={node} color={category.color} />
                    </section>

                    <section>
                        <SectionTitle>Evidence</SectionTitle>
                        <EvidenceFiles node={node} color={category.color} />
                    </section>

                    {prerequisites.length > 0 && (
                        <section>
                            <SectionTitle>Requires</SectionTitle>
                            <ul>
                                {prerequisites.map(p => (
                                    <SkillLink key={p.id} node={p} onSelect={onSelect} />
                                ))}
                            </ul>
                        </section>
                    )}

                    {unlocks.length > 0 && (
                        <section>
                            <SectionTitle>Unlocks</SectionTitle>
                            <ul>
                                {unlocks.map(d => (
                                    <SkillLink key={d.id} node={d} onSelect={onSelect} />
                                ))}
                            </ul>
                        </section>
                    )}

                    {(node.target_date || node.completed_at || node.evidence_url) && (
                        <section className="space-y-2 text-[15px] font-medium text-parchment">
                            <SectionTitle>Record</SectionTitle>
                            {node.target_date && (
                                <p className="flex items-center gap-2">
                                    <CalendarDays size={16} className="text-gold-600" /> Target: {node.target_date}
                                    {deadline && (
                                        <span
                                            className={`ml-auto text-xs font-bold uppercase tracking-wider ${deadline.kind === 'overdue' ? 'animate-pulse' : ''}`}
                                            style={{ color: DEADLINE_COLORS[deadline.kind] }}
                                        >
                                            {deadlineLabel(deadline)}
                                        </span>
                                    )}
                                </p>
                            )}
                            {node.completed_at && (
                                <p className="flex items-center gap-2">
                                    <CalendarDays size={16} className="text-gold-600" /> Completed:{' '}
                                    {new Date(node.completed_at).toLocaleDateString()}
                                </p>
                            )}
                            {node.evidence_url && (
                                <a
                                    href={node.evidence_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 text-gold-400 hover:text-gold-200"
                                >
                                    <ExternalLink size={16} /> View evidence
                                </a>
                            )}
                        </section>
                    )}

                    <section>
                        <SectionTitle>Actions</SectionTitle>
                        <div className="flex flex-wrap gap-2">
                            <GameButton onClick={() => setMode('add')}>
                                <Plus size={15} /> Branch
                            </GameButton>
                            <GameButton onClick={() => setMode('edit')}>
                                <Pencil size={15} /> Edit
                            </GameButton>
                            <GameButton variant="danger" onClick={destroy}>
                                <Trash2 size={15} /> Delete
                            </GameButton>
                        </div>
                    </section>
                </>
            )}
        </Shell>
    )
}

export function CategoryPanel({ category, categories, nodes, onClose, onEdit }) {
    const [adding, setAdding] = useState(false)
    const Icon = getIcon(category.icon)
    const { done, total } = categoryProgress(nodes, category.id)

    return (
        <Shell
            color={category.color}
            title={category.name}
            Icon={Icon}
            subtitle={`Lv. ${category.level} · ${category.xp} XP · ${done}/${total} completed`}
            onClose={onClose}
        >
            {adding ? (
                <>
                    <SectionTitle>New skill</SectionTitle>
                    <NodeForm
                        key={`root-${category.id}`}
                        categoryId={category.id}
                        nodes={nodes}
                        categories={categories}
                        onDone={() => setAdding(false)}
                        onCancel={() => setAdding(false)}
                    />
                </>
            ) : (
                <section>
                    <SectionTitle>Actions</SectionTitle>
                    <div className="flex flex-wrap gap-2">
                        <GameButton variant="gold" onClick={() => setAdding(true)}>
                            <Plus size={15} /> Add skill
                        </GameButton>
                        <GameButton onClick={onEdit}>
                            <Pencil size={15} /> Edit category
                        </GameButton>
                    </div>
                </section>
            )}
        </Shell>
    )
}
