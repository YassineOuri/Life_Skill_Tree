import { useForm } from '@inertiajs/react'
import { Check } from 'lucide-react'
import { dependentIds } from '../lib/layout'
import { RARITIES } from '../lib/progression'
import IconPicker from './IconPicker'
import { Field, GameButton, inputClass } from './ui'

/**
 * Create (pass categoryId + prerequisiteIds) or edit (pass node) a skill.
 * requiredBy: ids of existing skills that will require the new one (adding it as their leaf).
 */
export default function NodeForm({ node, categoryId, prerequisiteIds = [], requiredBy = [], nodes, categories, onDone, onCancel }) {
    const editing = Boolean(node)
    const { data, setData, transform, post, put, processing, errors } = useForm({
        category_id: node?.category_id ?? categoryId,
        prerequisite_ids: node?.prerequisite_ids ?? prerequisiteIds,
        dependent_ids: editing ? undefined : requiredBy,
        title: node?.title ?? '',
        description: node?.description ?? '',
        icon: node?.icon ?? '',
        rarity: node?.rarity ?? 'common',
        target_date: node?.target_date ?? '',
        evidence_url: node?.evidence_url ?? '',
        completed_at: node?.completed_at?.slice(0, 10) ?? '',
    })

    // A skill cannot require itself or anything that already requires it (including, for a new
    // leaf, the skills it is added under and whatever requires those).
    const above = editing ? [node.id] : requiredBy
    const excluded = above.flatMap(id => [id, ...dependentIds(nodes, id)])
    // Any category may provide prerequisites; the skill's own category is listed first.
    const candidates = nodes.filter(n => !excluded.includes(n.id))
    const groups = [...categories]
        .sort((a, b) => (b.id === data.category_id) - (a.id === data.category_id))
        .map(c => ({ category: c, skills: candidates.filter(n => n.category_id === c.id) }))
        .filter(g => g.skills.length)
    const completedEdit = editing && node.status === 'completed'
    const relocks =
        completedEdit &&
        data.prerequisite_ids.some(id => nodes.find(n => n.id === id)?.status !== 'completed')
    const completedAbove = nodes.filter(n => requiredBy.includes(n.id) && n.status === 'completed')

    const togglePrerequisite = id =>
        setData(
            'prerequisite_ids',
            data.prerequisite_ids.includes(id) ? data.prerequisite_ids.filter(p => p !== id) : [...data.prerequisite_ids, id],
        )

    const submit = e => {
        e.preventDefault()
        transform(d => (completedEdit ? d : { ...d, completed_at: null }))
        const options = { preserveScroll: true, onSuccess: () => onDone?.() }
        editing ? put(`/nodes/${node.id}`, options) : post('/nodes', options)
    }

    return (
        <form onSubmit={submit} className="space-y-3">
            <Field label="Title" error={errors.title}>
                <input className={inputClass} value={data.title} onChange={e => setData('title', e.target.value)} autoFocus />
            </Field>

            <Field label="Prerequisites" error={errors.prerequisite_ids ?? errors['prerequisite_ids.0'] ?? errors.dependent_ids}>
                <div className="max-h-44 space-y-0.5 overflow-y-auto border border-ink-600 bg-ink-950/80 p-1.5">
                    {groups.length === 0 && <p className="px-1 py-1 text-sm text-parchment-dim">No other skills yet.</p>}
                    {groups.map(({ category, skills }) => (
                        <div key={category.id}>
                            <p
                                className="flex items-center gap-1.5 px-1 pb-0.5 pt-1.5 text-[10px] font-bold uppercase tracking-[0.2em]"
                                style={{ color: category.color }}
                            >
                                <span className="diamond h-1.5 w-1.5" style={{ background: category.color }} />
                                {category.name}
                            </p>
                            {skills.map(n => {
                                const checked = data.prerequisite_ids.includes(n.id)
                                return (
                                    <button
                                        type="button"
                                        key={n.id}
                                        onClick={() => togglePrerequisite(n.id)}
                                        className={`flex w-full items-center gap-2 px-1.5 py-1 text-left text-sm font-semibold hover:bg-ink-800 ${
                                            checked ? 'text-gold-300' : 'text-parchment-dim'
                                        }`}
                                    >
                                        <span
                                            className={`diamond flex h-4 w-4 shrink-0 items-center justify-center ${checked ? 'metal-gold' : 'bg-ink-700'}`}
                                        >
                                            {checked && <Check size={10} strokeWidth={4} className="text-[var(--on-gold)]" />}
                                        </span>
                                        <span className="truncate">{n.title}</span>
                                        {n.status === 'completed' && <span className="ml-auto text-[10px] uppercase tracking-wider text-gold-600">done</span>}
                                    </button>
                                )
                            })}
                        </div>
                    ))}
                </div>
                {completedAbove.length > 0 && (
                    <span className="mt-1 block text-xs font-semibold text-amber-500">
                        {completedAbove.map(n => n.title).join(', ')} will show as locked until this new skill is completed (it stays completed).
                    </span>
                )}
                {relocks && (
                    <span className="mt-1 block text-xs font-semibold text-amber-500">
                        This skill will show as locked until the new prerequisites are completed (it stays completed).
                    </span>
                )}
            </Field>

            <Field label="Description" error={errors.description}>
                <textarea
                    rows={3}
                    className={inputClass}
                    value={data.description}
                    onChange={e => setData('description', e.target.value)}
                />
            </Field>

            <div className="grid grid-cols-2 gap-3">
                <Field label="Rarity" error={errors.rarity}>
                    <select
                        className={inputClass}
                        value={data.rarity}
                        onChange={e => setData('rarity', e.target.value)}
                        style={{ color: RARITIES[data.rarity]?.color }}
                    >
                        {Object.entries(RARITIES).map(([key, r]) => (
                            <option key={key} value={key} style={{ color: r.color }}>
                                {r.label} · {r.xp} XP
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Icon" error={errors.icon}>
                    <IconPicker
                        value={data.icon}
                        onChange={icon => setData('icon', icon)}
                        color={categories.find(c => c.id === data.category_id)?.color}
                    />
                </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Field label="Target date" error={errors.target_date}>
                    <input
                        type="date"
                        className={`${inputClass} [color-scheme:dark]`}
                        value={data.target_date}
                        onChange={e => setData('target_date', e.target.value)}
                    />
                </Field>
                {completedEdit && (
                    <Field label="Completed on" error={errors.completed_at}>
                        <input
                            type="date"
                            className={`${inputClass} [color-scheme:dark]`}
                            max={new Date().toISOString().slice(0, 10)}
                            value={data.completed_at}
                            onChange={e => setData('completed_at', e.target.value)}
                        />
                    </Field>
                )}
            </div>

            <Field label="Evidence URL" error={errors.evidence_url}>
                <input
                    className={inputClass}
                    placeholder="https://www.credly.com/badges/…"
                    value={data.evidence_url}
                    onChange={e => setData('evidence_url', e.target.value)}
                />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
                <GameButton type="button" onClick={onCancel}>
                    Cancel
                </GameButton>
                <GameButton variant="gold" disabled={processing}>
                    {editing ? 'Save' : 'Add skill'}
                </GameButton>
            </div>
        </form>
    )
}
