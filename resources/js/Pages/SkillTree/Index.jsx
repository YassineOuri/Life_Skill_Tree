import '@xyflow/react/dist/style.css'
import { Head, router } from '@inertiajs/react'
import { Background, BackgroundVariant, Controls, MiniMap, ReactFlow } from '@xyflow/react'
import { BookOpenText, CircleDot, Library, Moon, Plus, RectangleHorizontal, Scroll, Search, Swords, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import CategoryModal from '../../Components/CategoryModal'
import CategoryNode from '../../Components/CategoryNode'
import LibraryModal from '../../Components/LibraryModal'
import { CategoryPanel, SkillPanel } from '../../Components/NodePanel'
import SearchPalette from '../../Components/SearchPalette'
import SkillNode from '../../Components/SkillNode'
import { GameButton, Hex } from '../../Components/ui'
import { buildGraph, categoryProgress } from '../../lib/layout'
import { levelPercent } from '../../lib/progression'
import { SOUND_PREFERENCE, sounds } from '../../lib/sound'

const nodeTypes = { skill: SkillNode, category: CategoryNode }

// Canvas colours React Flow needs as plain values (SVG attributes cannot read CSS variables).
const CANVAS = {
    dark: { cross: '#2e281e', minimap: '#090806', mask: 'rgba(9, 8, 6, 0.75)', lockedNode: '#2e281e' },
    parchment: { cross: '#c9b48a', minimap: '#efe3c4', mask: 'rgba(120, 90, 40, 0.25)', lockedNode: '#bba57a' },
}

/** A per-browser preference. Storage can be unavailable (private mode), so failures are ignored. */
function usePreference(key, fallback) {
    const [value, setValue] = useState(() => {
        try {
            return localStorage.getItem(key) ?? fallback
        } catch {
            return fallback
        }
    })
    const update = next => {
        setValue(next)
        try {
            localStorage.setItem(key, next)
        } catch {
            // not persisted, still applied for this visit
        }
    }
    return [value, update]
}

/**
 * Ids of nodes that just got unlocked or completed, mapped to a one-off token
 * (the token re-mounts the burst effect so it replays).
 */
function useBursts(nodes) {
    const previous = useRef(null)
    const [bursts, setBursts] = useState({})

    useEffect(() => {
        const before = previous.current
        previous.current = new Map(nodes.map(n => [n.id, n]))
        if (!before) return

        const fresh = {}
        let anyCompleted = false
        for (const n of nodes) {
            const old = before.get(n.id)
            if (!old) continue
            const unlocked = old.locked && !n.locked
            const completed = old.status !== 'completed' && n.status === 'completed'
            anyCompleted ||= completed
            if (unlocked || completed) fresh[n.id] = `${n.id}-${Date.now()}`
        }
        if (!Object.keys(fresh).length) return

        anyCompleted ? sounds.complete() : sounds.unlock()

        setBursts(fresh)
        const timer = setTimeout(() => setBursts({}), 1300)
        return () => clearTimeout(timer)
    }, [nodes])

    return bursts
}

function Tab({ active, color, onClick, children, progress }) {
    const pct = progress?.total ? (progress.done / progress.total) * 100 : 0
    return (
        <button
            onClick={onClick}
            className={`chamfer relative shrink-0 p-px transition ${active ? 'metal-gold' : 'bg-transparent hover:bg-ink-700'}`}
            style={{ '--c': '8px' }}
        >
            <span
                className={`chamfer flex items-center gap-2 px-4 pb-2.5 pt-1.5 text-sm font-bold uppercase tracking-[0.14em] ${
                    active ? 'bg-ink-850 text-gold-300' : 'text-parchment-dim hover:text-parchment'
                }`}
                style={{ '--c': '7px' }}
            >
                {color && <span className="diamond h-2.5 w-2.5" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />}
                {children}
                {progress && (
                    <span className="text-xs font-semibold text-gold-600">
                        {progress.done}/{progress.total}
                    </span>
                )}
            </span>
            {progress && (
                <span className="absolute inset-x-4 bottom-1 h-[2px] bg-ink-700">
                    <span className="block h-full" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 4px ${color}` }} />
                </span>
            )}
        </button>
    )
}

export default function Index({ character, categories, nodes, templates = [] }) {
    const [activeTab, setActiveTab] = useState('all')
    const [selection, setSelection] = useState(null) // { type: 'skill' | 'category', id }
    const [modal, setModal] = useState(null) // { category: Category | null }
    const [libraryOpen, setLibraryOpen] = useState(false)
    const [theme, setTheme] = usePreference('skill-tree.theme', 'dark')
    const [variant, setVariant] = usePreference('skill-tree.variant', 'card')
    const bursts = useBursts(nodes)
    const [sound, setSound] = usePreference(SOUND_PREFERENCE, 'on')

    // Fanfare when the character level rises (after the completion sound).
    const previousLevel = useRef(character.level)
    useEffect(() => {
        if (character.level > previousLevel.current) {
            const timer = setTimeout(() => sounds.levelUp(), 700)
            previousLevel.current = character.level
            return () => clearTimeout(timer)
        }
        previousLevel.current = character.level
    }, [character.level])
    const canvas = CANVAS[theme] ?? CANVAS.dark

    useEffect(() => {
        document.documentElement.dataset.theme = theme
    }, [theme])

    const visibleCategories = useMemo(
        () => (activeTab === 'all' ? categories : categories.filter(c => c.id === activeTab)),
        [activeTab, categories],
    )
    const graph = useMemo(() => buildGraph(visibleCategories, nodes, variant, categories), [visibleCategories, nodes, variant, categories])

    const selectedKey = selection && `${selection.type}-${selection.id}`
    // elementsSelectable is off (it would let React Flow manage selection), so pass ours through data.
    const flowNodes = graph.nodes.map(n => ({
        ...n,
        data: { ...n.data, selected: n.id === selectedKey, burst: n.type === 'skill' ? bursts[n.data.node.id] : undefined },
    }))

    const selectedSkill = selection?.type === 'skill' ? nodes.find(n => n.id === selection.id) : null
    const selectedCategory =
        selection && categories.find(c => c.id === (selectedSkill ? selectedSkill.category_id : selection.id))

    const total = { done: nodes.filter(n => n.status === 'completed').length, total: nodes.length }
    const activeCategory = activeTab !== 'all' && categories.find(c => c.id === activeTab)
    const activeEmpty = activeCategory && !nodes.some(n => n.category_id === activeCategory.id)

    const switchTab = tab => {
        setActiveTab(tab)
        setSelection(null)
    }

    // Search / linked-skill navigation: switch tab, select, then centre once the canvas is ready.
    const [searchOpen, setSearchOpen] = useState(false)
    const [pendingFocus, setPendingFocus] = useState(null) // React Flow node id
    const [flowVersion, setFlowVersion] = useState(0)
    const flow = useRef(null)

    useEffect(() => {
        const onKey = e => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault()
                setSearchOpen(open => !open)
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    useEffect(() => {
        if (!pendingFocus || !flow.current) return
        const frame = requestAnimationFrame(() => {
            if (!flow.current.getNode(pendingFocus)) return
            flow.current.fitView({ nodes: [{ id: pendingFocus }], duration: 600, maxZoom: 1.2, padding: 0.8 })
            setPendingFocus(null)
        })
        return () => cancelAnimationFrame(frame)
    }, [pendingFocus, flowVersion])

    const focus = ({ type, id }) => {
        const categoryId = type === 'skill' ? nodes.find(n => n.id === id)?.category_id : id
        if (!categoryId) return
        setActiveTab(categoryId)
        setSelection({ type, id })
        setPendingFocus(`${type}-${id}`)
    }

    const onNodeClick = (_, flowNode) => {
        if (flowNode.type === 'category') setSelection({ type: 'category', id: flowNode.data.category.id })
        else setSelection({ type: 'skill', id: flowNode.data.node.id })
    }

    return (
        <div className="flex h-screen flex-col bg-ink-950">
            <Head title="Skill Tree" />

            <header className="stone relative flex items-center gap-5 px-5 py-3">
                <div className="flex shrink-0 items-center gap-3">
                    {/* character level */}
                    <Hex size={48} frameClass="metal-gold" faceStyle={{ background: 'var(--color-ink-900)' }}>
                        <div className="text-center leading-none" title={`Character level ${character.level}`}>
                            <div className="text-[8px] font-bold tracking-[0.2em] text-gold-600">LV</div>
                            <div className="text-gold font-display text-lg font-extrabold">{character.level}</div>
                        </div>
                    </Hex>
                    <div className="w-56 leading-none">
                        <h1 className="text-gold whitespace-nowrap font-display text-xl font-extrabold uppercase tracking-[0.12em]">Life Skill Tree</h1>
                        <div
                            className="mt-1.5 h-1.5 bg-ink-700"
                            title={`${character.xp - character.floor} / ${character.next - character.floor} XP to level ${character.level + 1}`}
                        >
                            <div
                                className="metal-gold h-full transition-all duration-700"
                                style={{ width: `${levelPercent(character)}%`, boxShadow: '0 0 6px #dcb85c' }}
                            />
                        </div>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gold-600">
                            {character.xp} XP · {total.done} / {total.total} completed
                        </p>
                    </div>
                </div>

                <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <Tab active={activeTab === 'all'} onClick={() => switchTab('all')}>
                        All
                    </Tab>
                    {categories.map(c => (
                        <Tab
                            key={c.id}
                            active={activeTab === c.id}
                            color={c.color}
                            progress={categoryProgress(nodes, c.id)}
                            onClick={() => switchTab(c.id)}
                        >
                            {c.name}
                        </Tab>
                    ))}
                </nav>

                <div className="flex shrink-0 gap-1">
                    <GameButton title="Search (Ctrl+K)" onClick={() => setSearchOpen(true)}>
                        <Search size={16} />
                        <kbd className="text-[10px] opacity-60">Ctrl K</kbd>
                    </GameButton>
                    <GameButton title="Library: templates, import, export" onClick={() => setLibraryOpen(true)}>
                        <Library size={16} />
                    </GameButton>
                    <GameButton title="Chronicle" onClick={() => router.visit('/chronicle')}>
                        <BookOpenText size={16} /> Chronicle
                    </GameButton>
                    <GameButton title={sound === 'on' ? 'Mute sounds' : 'Unmute sounds'} onClick={() => setSound(sound === 'on' ? 'off' : 'on')}>
                        {sound === 'on' ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </GameButton>
                    <GameButton
                        title={variant === 'card' ? 'Switch to medallions' : 'Switch to cards'}
                        onClick={() => setVariant(variant === 'card' ? 'medallion' : 'card')}
                    >
                        {variant === 'card' ? <CircleDot size={16} /> : <RectangleHorizontal size={16} />}
                    </GameButton>
                    <GameButton
                        title={theme === 'dark' ? 'Switch to parchment' : 'Switch to night'}
                        onClick={() => setTheme(theme === 'dark' ? 'parchment' : 'dark')}
                    >
                        {theme === 'dark' ? <Scroll size={16} /> : <Moon size={16} />}
                    </GameButton>
                </div>

                <GameButton variant="gold" onClick={() => setModal({ category: null })} className="shrink-0">
                    <Plus size={16} /> Category
                </GameButton>

                {/* gold rule under the header */}
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
            </header>

            <main className="game-canvas relative flex-1">
                {categories.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-5">
                        <Hex size={88} frameClass="metal-gold" faceStyle={{ background: 'var(--color-ink-900)' }}>
                            <Swords size={36} className="text-gold-500" />
                        </Hex>
                        <p className="font-display text-lg tracking-widest text-parchment-dim">Your legend is unwritten.</p>
                        <GameButton variant="gold" onClick={() => setModal({ category: null })}>
                            Create your first category
                        </GameButton>
                    </div>
                ) : (
                    <ReactFlow
                        key={`${activeTab}-${variant}`}
                        onInit={instance => {
                            flow.current = instance
                            setFlowVersion(v => v + 1)
                        }}
                        nodes={flowNodes}
                        edges={graph.edges}
                        nodeTypes={nodeTypes}
                        onNodeClick={onNodeClick}
                        onPaneClick={() => setSelection(null)}
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable={false}
                        colorMode={theme === 'parchment' ? 'light' : 'dark'}
                        fitView
                        fitViewOptions={{ padding: 0.2, maxZoom: 1.1 }}
                        minZoom={0.15}
                        proOptions={{ hideAttribution: true }}
                    >
                        <Background variant={BackgroundVariant.Cross} gap={48} size={4} color={canvas.cross} bgColor="transparent" />
                        <Controls showInteractive={false} />
                        <MiniMap
                            pannable
                            zoomable
                            bgColor={canvas.minimap}
                            maskColor={canvas.mask}
                            nodeColor={n => (n.type === 'category' ? '#dcb85c' : n.data.node.locked ? canvas.lockedNode : n.data.color)}
                        />
                    </ReactFlow>
                )}

                {activeEmpty && !selection && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center">
                        <GameButton
                            className="pointer-events-auto"
                            onClick={() => setSelection({ type: 'category', id: activeCategory.id })}
                        >
                            <Plus size={16} /> Add first skill
                        </GameButton>
                    </div>
                )}

                {selectedSkill && selectedCategory && (
                    <SkillPanel
                        key={selectedSkill.id}
                        node={selectedSkill}
                        category={selectedCategory}
                        categories={categories}
                        nodes={nodes}
                        onClose={() => setSelection(null)}
                        onSelect={id => focus({ type: 'skill', id })}
                    />
                )}
                {selection?.type === 'category' && selectedCategory && (
                    <CategoryPanel
                        key={selectedCategory.id}
                        category={selectedCategory}
                        categories={categories}
                        nodes={nodes}
                        onClose={() => setSelection(null)}
                        onEdit={() => setModal({ category: selectedCategory })}
                    />
                )}
            </main>

            {libraryOpen && <LibraryModal categories={categories} templates={templates} onClose={() => setLibraryOpen(false)} />}

            {searchOpen && (
                <SearchPalette categories={categories} nodes={nodes} onPick={focus} onClose={() => setSearchOpen(false)} />
            )}

            {modal && (
                <CategoryModal
                    category={modal.category}
                    onClose={() => setModal(null)}
                    onDeleted={() => {
                        setModal(null)
                        setSelection(null)
                        setActiveTab('all')
                    }}
                />
            )}
        </div>
    )
}
