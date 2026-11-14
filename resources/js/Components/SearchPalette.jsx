import { CornerDownLeft, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { getIcon } from '../lib/icons'
import { Frame } from './ui'

const LIMIT = 12

/** 0 = title starts with query, 1 = a word starts with it, 2 = contains it, null = no match. */
function rank(title, query) {
    const t = title.toLowerCase()
    if (t.startsWith(query)) return 0
    if (t.split(/[\s\-–—·(/]+/).some(word => word.startsWith(query))) return 1
    return t.includes(query) ? 2 : null
}

function statusLabel(node) {
    if (node.status === 'completed') return 'Completed'
    if (node.locked) return 'Locked'
    return node.status === 'in_progress' ? 'Training' : 'Available'
}

/** Ctrl/Cmd+K palette over skills and categories. onPick({ type: 'skill' | 'category', id }). */
export default function SearchPalette({ categories, nodes, onPick, onClose }) {
    const [query, setQuery] = useState('')
    const [active, setActive] = useState(0)

    const results = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return []
        const byId = new Map(categories.map(c => [c.id, c]))
        return [
            ...categories.map(c => ({ type: 'category', id: c.id, title: c.name, category: c })),
            ...nodes.map(n => ({ type: 'skill', id: n.id, title: n.title, category: byId.get(n.category_id), node: n })),
        ]
            .map(r => ({ ...r, score: rank(r.title, q) }))
            .filter(r => r.score !== null && r.category)
            .sort((a, b) => a.score - b.score || a.title.localeCompare(b.title))
            .slice(0, LIMIT)
    }, [query, categories, nodes])

    const pick = result => {
        onPick({ type: result.type, id: result.id })
        onClose()
    }

    const onKeyDown = e => {
        if (e.key === 'Escape') onClose()
        else if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive(i => Math.min(i + 1, results.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive(i => Math.max(i - 1, 0))
        } else if (e.key === 'Enter' && results[active]) pick(results[active])
    }

    return (
        <div className="fixed inset-0 z-30 flex justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={onClose}>
            <div className="h-fit w-full max-w-xl" onMouseDown={e => e.stopPropagation()} style={{ filter: 'drop-shadow(0 0 24px rgb(196 154 50 / 0.25))' }}>
                <Frame cut={16} inset={2} frameClass="metal-gold">
                    <div className="flex items-center gap-3 border-b border-ink-700 px-4 py-3">
                        <Search size={18} className="text-gold-500" />
                        <input
                            autoFocus
                            className="flex-1 bg-transparent text-lg font-semibold text-parchment placeholder-ink-600 focus:outline-none"
                            placeholder="Search skills and categories…"
                            value={query}
                            onChange={e => {
                                setQuery(e.target.value)
                                setActive(0)
                            }}
                            onKeyDown={onKeyDown}
                        />
                        <kbd className="border border-ink-600 px-1.5 text-[10px] font-bold text-parchment-dim">ESC</kbd>
                    </div>

                    <ul className="max-h-[50vh] overflow-y-auto py-1">
                        {query.trim() && results.length === 0 && <li className="px-4 py-6 text-center text-parchment-dim">Nothing found.</li>}
                        {!query.trim() && <li className="px-4 py-6 text-center text-parchment-dim">Type to search your tree.</li>}
                        {results.map((r, i) => {
                            const Icon = getIcon(r.type === 'skill' ? r.node.icon : r.category.icon)
                            return (
                                <li key={`${r.type}-${r.id}`}>
                                    <button
                                        type="button"
                                        onMouseEnter={() => setActive(i)}
                                        onClick={() => pick(r)}
                                        className={`flex w-full items-center gap-3 px-4 py-2 text-left ${i === active ? 'bg-ink-800' : ''}`}
                                    >
                                        <Icon size={18} style={{ color: r.category.color }} />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-[15px] font-bold text-parchment">{r.title}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: r.category.color }}>
                                                {r.type === 'category' ? 'Category' : r.category.name}
                                            </span>
                                        </span>
                                        {r.type === 'skill' && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-parchment-dim">{statusLabel(r.node)}</span>
                                        )}
                                        {i === active && <CornerDownLeft size={14} className="text-gold-500" />}
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                </Frame>
            </div>
        </div>
    )
}
