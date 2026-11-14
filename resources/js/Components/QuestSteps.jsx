import { router } from '@inertiajs/react'
import { Check, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { stepProgress } from '../lib/progression'
import { sounds } from '../lib/sound'
import { inputClass } from './ui'

function StepRow({ step, color, disabled, onError }) {
    const [editing, setEditing] = useState(false)
    const [title, setTitle] = useState(step.title)
    const done = Boolean(step.done_at)

    const options = { preserveScroll: true, onError }
    const toggle = () => router.patch(`/steps/${step.id}/toggle`, {}, { ...options, onSuccess: () => !done && sounds.tick() })
    const remove = () => router.delete(`/steps/${step.id}`, options)
    const save = () => {
        setEditing(false)
        if (title.trim() && title !== step.title) router.put(`/steps/${step.id}`, { title }, options)
        else setTitle(step.title)
    }

    return (
        <li className="group flex items-center gap-2.5 py-1">
            <button
                type="button"
                onClick={toggle}
                disabled={disabled}
                aria-label={done ? 'Mark as not done' : 'Mark as done'}
                className="diamond flex h-5 w-5 shrink-0 items-center justify-center transition disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: done ? color : 'var(--color-ink-700)', boxShadow: done ? `0 0 6px ${color}` : undefined }}
            >
                {done && <Check size={11} strokeWidth={4} className="text-[var(--on-gold)]" />}
            </button>

            {editing ? (
                <input
                    autoFocus
                    className={`${inputClass} py-1`}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onBlur={save}
                    onKeyDown={e => {
                        if (e.key === 'Enter') save()
                        if (e.key === 'Escape') {
                            setTitle(step.title)
                            setEditing(false)
                        }
                    }}
                />
            ) : (
                <button
                    type="button"
                    onClick={() => setEditing(true)}
                    title="Click to rename"
                    className={`min-w-0 flex-1 truncate text-left text-[15px] font-semibold ${
                        done ? 'text-parchment-dim line-through decoration-gold-600' : 'text-parchment'
                    }`}
                >
                    {step.title}
                </button>
            )}

            <button
                type="button"
                onClick={remove}
                aria-label="Delete step"
                className="text-parchment-dim opacity-0 transition hover:text-red-400 group-hover:opacity-100"
            >
                <X size={15} />
            </button>
        </li>
    )
}

/** Quest checklist of a skill: add, rename (click), check, delete. */
export default function QuestSteps({ node, color }) {
    const [title, setTitle] = useState('')
    const [error, setError] = useState(null)
    const { done, total, percent } = stepProgress(node)

    const onError = errors => setError(errors.steps ?? errors.title)

    const add = e => {
        e.preventDefault()
        if (!title.trim()) return
        setError(null)
        router.post(`/nodes/${node.id}/steps`, { title }, { preserveScroll: true, onSuccess: () => setTitle(''), onError })
    }

    return (
        <div>
            {total > 0 && (
                <div className="mb-2 flex items-center gap-3">
                    <div className="h-1.5 flex-1 bg-ink-700">
                        <div className="h-full transition-all" style={{ width: `${percent}%`, background: color, boxShadow: `0 0 6px ${color}` }} />
                    </div>
                    <span className="text-xs font-bold text-parchment-dim">
                        {done}/{total}
                    </span>
                </div>
            )}

            <ul>
                {node.steps.map(step => (
                    <StepRow key={step.id} step={step} color={color} disabled={node.locked} onError={onError} />
                ))}
            </ul>

            {!node.locked && (
                <form onSubmit={add} className="mt-2 flex gap-2">
                    <input
                        className={`${inputClass} py-1.5`}
                        placeholder="New quest step…"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />
                    <button
                        className="chamfer metal-gold flex w-9 shrink-0 items-center justify-center text-[var(--on-gold)]"
                        style={{ '--c': '6px' }}
                        aria-label="Add step"
                    >
                        <Plus size={16} />
                    </button>
                </form>
            )}
            {node.locked && total === 0 && <p className="text-sm text-parchment-dim">Unlock this skill to plan its quest.</p>}
            {error && <p className="mt-2 text-sm font-semibold text-red-400">{error}</p>}
        </div>
    )
}
