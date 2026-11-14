import { router } from '@inertiajs/react'
import { Download, FileJson, Library, Trash2, TriangleAlert, Upload, X } from 'lucide-react'
import { useState } from 'react'
import IconPicker from './IconPicker'
import { Field, Frame, GameButton, Hex, inputClass } from './ui'

const TABS = [
    { key: 'templates', label: 'Templates' },
    { key: 'import', label: 'Import' },
    { key: 'export', label: 'Export' },
    { key: 'reset', label: 'Reset', danger: true },
]

function ExportTab() {
    return (
        <div className="space-y-4">
            <p className="text-[15px] text-parchment-dim">
                Download your whole tree as a JSON backup: categories, skills, prerequisites (across categories), quest steps, dates and
                statuses. Uploaded evidence files are listed by name but not included.
            </p>
            <a
                href="/library/export"
                download
                className="chamfer metal-gold inline-flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider text-[var(--on-gold)]"
                style={{ '--c': '7px' }}
            >
                <Download size={16} /> Download backup
            </a>
        </div>
    )
}

function ImportTab({ onDone }) {
    const [file, setFile] = useState(null)
    const [error, setError] = useState(null)
    const [processing, setProcessing] = useState(false)

    const submit = () => {
        setError(null)
        setProcessing(true)
        router.post('/library/import', { file }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => onDone('Backup imported as new categories.'),
            onError: errors => setError(errors.file),
            onFinish: () => setProcessing(false),
        })
    }

    return (
        <div className="space-y-4">
            <p className="text-[15px] text-parchment-dim">
                Import a backup file. It is added as <strong className="text-parchment">new categories</strong>; nothing you already have is
                changed or deleted. A name that already exists gets “(imported)”.
            </p>
            <label className="flex cursor-pointer items-center gap-3 border border-dashed border-ink-600 px-4 py-4 transition hover:border-gold-500">
                <FileJson size={22} className="text-gold-500" />
                <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-parchment">{file ? file.name : 'Choose a .json backup…'}</span>
                <input type="file" accept=".json,application/json" className="hidden" onChange={e => setFile(e.target.files[0] ?? null)} />
            </label>
            {error && <p className="text-sm font-semibold text-red-400">{error}</p>}
            <GameButton variant="gold" disabled={!file || processing} onClick={submit}>
                <Upload size={16} /> {processing ? 'Importing…' : 'Import'}
            </GameButton>
        </div>
    )
}

/** Irreversible wipe of every category, skill, quest step and evidence file. */
function ResetTab({ onDone }) {
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState(null)
    const [processing, setProcessing] = useState(false)

    const purge = () => {
        setError(null)
        setProcessing(true)
        router.delete('/library/purge', {
            data: { confirm },
            onSuccess: () => {
                setConfirm('')
                onDone('All data deleted. Your tree is empty.')
            },
            onError: errors => setError(errors.confirm),
            onFinish: () => setProcessing(false),
        })
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-3 border border-red-900 bg-[var(--danger-face)] p-4">
                <TriangleAlert size={22} className="shrink-0 text-[var(--danger-text)]" />
                <div className="space-y-1 text-[15px] text-parchment">
                    <p className="font-bold text-[var(--danger-text)]">This permanently deletes all your data.</p>
                    <p className="text-parchment-dim">
                        Every category, skill, prerequisite, quest step and uploaded certificate is removed. This cannot be undone. Your theme,
                        layout and sound settings are kept.
                    </p>
                    <p className="text-parchment-dim">
                        Want a copy first?{' '}
                        <a href="/library/export" download className="font-semibold text-gold-400 underline hover:text-gold-200">
                            Download a backup
                        </a>
                        .
                    </p>
                </div>
            </div>
            <div className="w-64">
                <Field label="Type DELETE to confirm" error={error}>
                    <input
                        className={inputClass}
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        placeholder="DELETE"
                        autoComplete="off"
                    />
                </Field>
            </div>
            <GameButton variant="danger" disabled={confirm !== 'DELETE' || processing} onClick={purge}>
                <Trash2 size={16} /> {processing ? 'Deleting…' : 'Delete all data'}
            </GameButton>
        </div>
    )
}

function TemplateCard({ template, categories, onDone }) {
    const [target, setTarget] = useState(categories[0]?.id ? String(categories[0].id) : 'new')
    const [newCategory, setNewCategory] = useState({ name: template.name, color: '#38bdf8', icon: '' })
    const [errors, setErrors] = useState({})
    const [processing, setProcessing] = useState(false)

    const apply = () => {
        setErrors({})
        setProcessing(true)
        const payload = target === 'new' ? { new_category: newCategory } : { category_id: Number(target) }
        router.post(`/library/templates/${template.key}`, payload, {
            preserveScroll: true,
            onSuccess: () => onDone(`“${template.name}” added (${template.skills.length} skills).`),
            onError: setErrors,
            onFinish: () => setProcessing(false),
        })
    }

    return (
        <li className="border border-ink-700 bg-ink-950/50 p-4">
            <div className="mb-2 flex items-baseline justify-between gap-3">
                <h3 className="text-gold font-display text-base font-bold">{template.name}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-parchment-dim">{template.skills.length} skills</span>
            </div>
            <p className="mb-2 text-sm text-parchment-dim">{template.description}</p>
            <div className="mb-3 flex flex-wrap gap-1">
                {template.skills.map(title => (
                    <span key={title} className="border border-ink-600 px-1.5 py-0.5 text-[11px] font-semibold text-parchment">
                        {title}
                    </span>
                ))}
            </div>

            <div className="flex flex-wrap items-end gap-2">
                <Field label="Add to" error={errors.category_id}>
                    <select className={`${inputClass} w-48`} value={target} onChange={e => setTarget(e.target.value)}>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                        <option value="new">+ New category…</option>
                    </select>
                </Field>
                {target === 'new' && (
                    <>
                        <Field label="Name" error={errors['new_category.name']}>
                            <input
                                className={`${inputClass} w-44`}
                                value={newCategory.name}
                                onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                            />
                        </Field>
                        <Field label="Colour" error={errors['new_category.color']}>
                            <input
                                type="color"
                                className="h-[38px] w-12 cursor-pointer border border-ink-600 bg-ink-950"
                                value={newCategory.color}
                                onChange={e => setNewCategory({ ...newCategory, color: e.target.value })}
                            />
                        </Field>
                        <div className="w-40">
                            <Field label="Icon">
                                <IconPicker
                                    value={newCategory.icon}
                                    color={newCategory.color}
                                    onChange={icon => setNewCategory({ ...newCategory, icon })}
                                />
                            </Field>
                        </div>
                    </>
                )}
                <GameButton variant="gold" disabled={processing} onClick={apply} className="mb-px">
                    {processing ? 'Adding…' : 'Add path'}
                </GameButton>
            </div>
        </li>
    )
}

/** Library: built-in templates, JSON import (merge) and JSON export. */
export default function LibraryModal({ categories, templates, onClose }) {
    const [tab, setTab] = useState('templates')
    const [notice, setNotice] = useState(null)

    return (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={onClose}>
            <div
                onMouseDown={e => e.stopPropagation()}
                className="w-full max-w-3xl"
                style={{ filter: 'drop-shadow(0 0 30px rgb(196 154 50 / 0.25))' }}
            >
                <Frame cut={20} inset={3} frameClass="metal-gold">
                    <div className="flex max-h-[85vh] flex-col p-6">
                        <div className="mb-4 flex items-center gap-4">
                            <Hex size={52} frameClass="metal-gold" faceStyle={{ background: 'var(--color-ink-900)' }}>
                                <Library size={22} className="text-gold-400" />
                            </Hex>
                            <h2 className="text-gold flex-1 font-display text-2xl font-bold">Library</h2>
                            <button onClick={onClose} className="text-parchment-dim hover:text-gold-300" aria-label="Close">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-4 flex gap-1">
                            {TABS.map(t => (
                                <GameButton
                                    key={t.key}
                                    active={tab === t.key}
                                    variant={t.danger ? 'danger' : 'dark'}
                                    className={t.danger ? 'ml-auto' : ''}
                                    onClick={() => setTab(t.key)}
                                >
                                    {t.label}
                                </GameButton>
                            ))}
                        </div>

                        {notice && <p className="mb-3 border-l-2 border-gold-500 pl-3 text-sm font-semibold text-gold-300">{notice}</p>}

                        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                            {tab === 'templates' && (
                                <ul className="space-y-3">
                                    {templates.map(t => (
                                        <TemplateCard key={t.key} template={t} categories={categories} onDone={setNotice} />
                                    ))}
                                </ul>
                            )}
                            {tab === 'import' && <ImportTab onDone={setNotice} />}
                            {tab === 'export' && <ExportTab />}
                            {tab === 'reset' && <ResetTab onDone={setNotice} />}
                        </div>
                    </div>
                </Frame>
            </div>
        </div>
    )
}
