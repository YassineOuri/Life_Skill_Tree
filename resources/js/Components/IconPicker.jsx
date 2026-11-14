import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ALL_ICON_NAMES, getIcon, ICON_GROUPS, isCuratedIcon, isKnownIcon } from '../lib/icons'
import { inputClass } from './ui'

const PANEL_WIDTH = 288
const PANEL_HEIGHT = 340
const MAX_EXTRA_RESULTS = 84

/**
 * Fixed position under (or above) the button. The panel is portalled to <body> because
 * clip-path frames and scrolling panels would otherwise cut it off.
 */
function panelPosition(button) {
    const r = button.getBoundingClientRect()
    const left = Math.max(8, Math.min(r.right - PANEL_WIDTH, window.innerWidth - PANEL_WIDTH - 8))
    const below = window.innerHeight - r.bottom
    const top = below >= PANEL_HEIGHT + 8 ? r.bottom + 4 : Math.max(8, r.top - PANEL_HEIGHT - 4)
    return { left, top }
}

/**
 * Button showing the current icon; opens a filterable, grouped grid of the curated icons.
 * Typing also searches the full lucide set (lazy-loaded), listed under "More icons".
 */
export default function IconPicker({ value, onChange, color = '#dcb85c' }) {
    const [open, setOpen] = useState(false)
    const [filter, setFilter] = useState('')
    const root = useRef(null)
    const panel = useRef(null)
    const [position, setPosition] = useState(null)
    const Icon = getIcon(value)
    const custom = value && !isKnownIcon(value)

    useEffect(() => {
        if (!open) return
        setPosition(panelPosition(root.current))
        const close = e => !root.current?.contains(e.target) && !panel.current?.contains(e.target) && setOpen(false)
        const reposition = () => setPosition(panelPosition(root.current))
        document.addEventListener('mousedown', close)
        window.addEventListener('resize', reposition)
        window.addEventListener('scroll', reposition, true)
        return () => {
            document.removeEventListener('mousedown', close)
            window.removeEventListener('resize', reposition)
            window.removeEventListener('scroll', reposition, true)
        }
    }, [open])

    const query = filter.trim().toLowerCase()
    const groups = Object.entries(ICON_GROUPS)
        .map(([group, icons]) => [group, Object.entries(icons).filter(([name]) => !query || name.includes(query) || group.toLowerCase().includes(query))])
        .filter(([, icons]) => icons.length)
    if (query.length >= 2) {
        const words = query.split(/\s+/)
        const matches = ALL_ICON_NAMES.filter(name => !isCuratedIcon(name) && words.every(w => name.includes(w)))
        if (matches.length) {
            const label = matches.length > MAX_EXTRA_RESULTS ? `More icons (${MAX_EXTRA_RESULTS} of ${matches.length})` : 'More icons'
            groups.push([label, matches.slice(0, MAX_EXTRA_RESULTS).map(name => [name, getIcon(name)])])
        }
    }

    const pick = name => {
        onChange(name)
        setOpen(false)
        setFilter('')
    }

    return (
        <div ref={root} className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`${inputClass} flex items-center gap-2 text-left`}
                title={custom ? `Custom icon “${value}” (not in the set, shown as a sparkle)` : value}
            >
                <Icon size={18} style={{ color }} />
                <span className="min-w-0 flex-1 truncate">{value ? (custom ? `custom: ${value}` : value) : 'Choose…'}</span>
                <ChevronDown size={15} className="text-parchment-dim" />
            </button>

            {open && position && createPortal(
                <div
                    ref={panel}
                    onMouseDown={e => e.stopPropagation()}
                    className="stone fixed z-50 border border-gold-700 p-2 shadow-2xl"
                    style={{ ...position, width: PANEL_WIDTH }}
                >
                    <input
                        autoFocus
                        className={`${inputClass} mb-2 py-1.5`}
                        placeholder="Filter icons…"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        onKeyDown={e => e.key === 'Escape' && setOpen(false)}
                    />
                    <div className="max-h-64 overflow-y-auto pr-1">
                        {groups.length === 0 && <p className="p-2 text-sm text-parchment-dim">No icon matches.</p>}
                        {query.length < 2 && (
                            <p className="mb-2 px-1 text-xs text-parchment-dim">Type to search all {ALL_ICON_NAMES.length} icons.</p>
                        )}
                        {groups.map(([group, icons]) => (
                            <div key={group} className="mb-2">
                                <p className="mb-1 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-gold-600">{group}</p>
                                <div className="grid grid-cols-7 gap-1">
                                    {icons.map(([name, GroupIcon]) => (
                                        <button
                                            type="button"
                                            key={name}
                                            title={name}
                                            onClick={() => pick(name)}
                                            className={`flex h-8 items-center justify-center border transition hover:border-gold-500 hover:bg-ink-800 ${
                                                name === value ? 'border-gold-400 bg-ink-800' : 'border-transparent'
                                            }`}
                                        >
                                            <GroupIcon size={17} style={{ color: name === value ? color : undefined }} className="text-parchment" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>,
                document.body,
            )}
        </div>
    )
}
