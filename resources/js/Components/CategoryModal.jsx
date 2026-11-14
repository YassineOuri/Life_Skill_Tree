import { router, useForm } from '@inertiajs/react'
import { getIcon } from '../lib/icons'
import IconPicker from './IconPicker'
import { Field, Frame, GameButton, Hex, inputClass } from './ui'

export default function CategoryModal({ category, onClose, onDeleted }) {
    const editing = Boolean(category)
    const { data, setData, post, put, processing, errors } = useForm({
        name: category?.name ?? '',
        color: category?.color ?? '#38bdf8',
        icon: category?.icon ?? '',
    })
    const Icon = getIcon(data.icon)

    const submit = e => {
        e.preventDefault()
        const options = { preserveScroll: true, onSuccess: onClose }
        editing ? put(`/categories/${category.id}`, options) : post('/categories', options)
    }

    const destroy = () => {
        if (!confirm(`Delete category "${category.name}" and all its skills?`)) return
        router.delete(`/categories/${category.id}`, { onSuccess: onDeleted })
    }

    return (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={onClose}>
            <div onMouseDown={e => e.stopPropagation()} className="w-full max-w-md" style={{ filter: 'drop-shadow(0 0 30px rgb(196 154 50 / 0.25))' }}>
                <Frame cut={20} inset={3} frameClass="metal-gold">
                    <form onSubmit={submit} className="space-y-4 p-6">
                        <div className="flex items-center gap-4">
                            <Hex
                                size={56}
                                frameClass="metal-gold"
                                faceStyle={{ background: `radial-gradient(circle at 50% 35%, ${data.color}, ${data.color}55 70%, var(--medal-shade))` }}
                            >
                                <Icon size={24} className="text-[var(--on-gold)]" strokeWidth={2.4} />
                            </Hex>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold-600">
                                    {editing ? 'Edit' : 'Found a new'}
                                </p>
                                <h2 className="text-gold font-display text-2xl font-bold">Category</h2>
                            </div>
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-gold-600 to-transparent" />

                        <Field label="Name" error={errors.name}>
                            <input className={inputClass} value={data.name} onChange={e => setData('name', e.target.value)} autoFocus />
                        </Field>

                        <div className="grid grid-cols-[auto_1fr] gap-3">
                            <Field label="Colour" error={errors.color}>
                                <input
                                    type="color"
                                    className="h-[38px] w-16 cursor-pointer border border-ink-600 bg-ink-950"
                                    value={data.color}
                                    onChange={e => setData('color', e.target.value)}
                                />
                            </Field>
                            <Field label="Icon" error={errors.icon}>
                                <IconPicker value={data.icon} onChange={icon => setData('icon', icon)} color={data.color} />
                            </Field>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            {editing && (
                                <GameButton type="button" variant="danger" onClick={destroy}>
                                    Delete
                                </GameButton>
                            )}
                            <div className="flex-1" />
                            <GameButton type="button" onClick={onClose}>
                                Cancel
                            </GameButton>
                            <GameButton variant="gold" disabled={processing}>
                                {editing ? 'Save' : 'Create'}
                            </GameButton>
                        </div>
                    </form>
                </Frame>
            </div>
        </div>
    )
}
