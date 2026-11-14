import dagre from '@dagrejs/dagre'

export const SKILL_SIZES = {
    card: { width: 210, height: 76 },
    medallion: { width: 150, height: 130 },
}
export const CATEGORY_SIZE = { width: 230, height: 86 }
const CATEGORY_GAP = 120

const hubId = categoryId => `category-${categoryId}`
const skillId = nodeId => `skill-${nodeId}`

export function categoryProgress(nodes, categoryId) {
    const own = nodes.filter(n => n.category_id === categoryId)
    return { done: own.filter(n => n.status === 'completed').length, total: own.length }
}

/** Ids of every skill that (transitively) requires nodeId, not including itself. */
export function dependentIds(nodes, nodeId) {
    const result = new Set()
    const stack = [nodeId]
    while (stack.length) {
        const id = stack.pop()
        for (const n of nodes) {
            if (n.prerequisite_ids.includes(id) && !result.has(n.id)) {
                result.add(n.id)
                stack.push(n.id)
            }
        }
    }
    return [...result]
}

function layoutCategory(category, nodes, variant, categoryNames) {
    const skillSize = SKILL_SIZES[variant] ?? SKILL_SIZES.card
    const g = new dagre.graphlib.Graph()
    g.setGraph({ rankdir: 'TB', nodesep: variant === 'medallion' ? 24 : 40, ranksep: variant === 'medallion' ? 56 : 70 })
    g.setDefaultEdgeLabel(() => ({}))

    const own = nodes.filter(n => n.category_id === category.id)
    g.setNode(hubId(category.id), { ...CATEGORY_SIZE }) // dagre mutates labels: never share them
    own.forEach(n => g.setNode(skillId(n.id), { ...skillSize }))

    const ownIds = new Set(own.map(n => n.id))
    const byId = new Map(own.map(n => [n.id, n]))
    // Edges point downwards, from a skill to what it requires: goals sit right under the hub,
    // their prerequisites below them. `upper` is a node id, `lower` the skill it leads down to.
    const edge = (upper, lower, lit, animated) => {
        g.setEdge(upper, skillId(lower.id))
        return {
            id: `e-${upper}-${lower.id}`,
            source: upper,
            target: skillId(lower.id),
            type: 'routed',
            animated: lit && animated,
            style: lit
                ? { stroke: category.color, strokeWidth: 3, filter: `drop-shadow(0 0 5px ${category.color})` }
                : { stroke: 'var(--color-ink-600)', strokeWidth: 2, strokeDasharray: '2 6', strokeLinecap: 'round' },
        }
    }

    // One edge per same-category prerequisite, lit once that prerequisite is completed.
    // Skills nothing else in the category requires (the goals) hang off the hub.
    const required = new Set(own.flatMap(n => n.prerequisite_ids.filter(id => ownIds.has(id))))
    const edges = [
        ...own.filter(n => !required.has(n.id)).map(n => edge(hubId(category.id), n, !n.locked, n.status === 'in_progress')),
        ...own.flatMap(n =>
            directPrerequisites(n, ownIds, byId).map(id =>
                edge(skillId(n.id), byId.get(id), byId.get(id).status === 'completed', n.status === 'in_progress'),
            ),
        ),
    ]

    dagre.layout(g)
    route(g, edges)

    const progress = categoryProgress(nodes, category.id)
    const flowNodes = [
        {
            id: hubId(category.id),
            type: 'category',
            data: { category, progress },
            ...position(g, hubId(category.id), CATEGORY_SIZE),
        },
        ...own.map(n => ({
            id: skillId(n.id),
            type: 'skill',
            data: { node: n, color: category.color, variant, external: externalPrerequisites(n, ownIds, nodes, categoryNames) },
            ...position(g, skillId(n.id), skillSize),
        })),
    ]

    return { nodes: flowNodes, edges, width: g.graph().width }
}

const LANE_SPACING = 8

/**
 * Store dagre's route on each edge (data.points), so RoutedEdge can follow it instead of
 * cutting straight through nodes. Dagre gives every edge a point in each gap between rows
 * ("gap" points) and, for edges skipping rows, points in a column it kept free ("row" points).
 * Edges from different sources crossing the same gap get their own horizontal lane there,
 * so their lines never merge into one ambiguous bar.
 */
function route(g, edges) {
    const rowYs = new Set(g.nodes().map(id => Math.round(g.node(id).y)))
    const routes = edges.map(e => ({
        edge: e,
        points: g.edge(e.source, e.target).points.slice(1, -1).map(p => ({ x: p.x, y: p.y, gap: !rowYs.has(Math.round(p.y)) })),
    }))

    // gap y -> sources crossing it, ordered left to right
    const gaps = new Map()
    for (const { edge, points } of routes) {
        for (const p of points.filter(p => p.gap)) {
            const key = Math.round(p.y)
            if (!gaps.has(key)) gaps.set(key, new Map())
            gaps.get(key).set(edge.source, Math.min(gaps.get(key).get(edge.source) ?? Infinity, g.node(edge.source).x))
        }
    }
    const lanes = new Map(
        [...gaps].map(([key, sources]) => {
            const ordered = [...sources].sort((a, b) => a[1] - b[1]).map(([id]) => id)
            return [key, new Map(ordered.map((id, i) => [id, (i - (ordered.length - 1) / 2) * LANE_SPACING]))]
        }),
    )

    for (const { edge, points } of routes) {
        edge.data = {
            ...edge.data,
            points: points.map(p => (p.gap ? { x: p.x, y: p.y + lanes.get(Math.round(p.y)).get(edge.source), gap: true } : p)),
        }
    }
}

/**
 * Orthogonal SVG path from (sx, sy) down to (tx, ty) through dagre's points: horizontal moves
 * only happen in gaps between rows, vertical ones in columns dagre kept clear of nodes.
 */
export function routedPath(sx, sy, tx, ty, points = []) {
    const gaps = points.filter(p => p.gap)
    if (!gaps.length) {
        const midY = (sy + ty) / 2
        return `M ${sx} ${sy} V ${midY} H ${tx} V ${ty}`
    }
    let d = `M ${sx} ${sy}`
    points.forEach(p => {
        if (!p.gap) return (d += ` V ${p.y}`)
        d += ` V ${p.y} H ${p === gaps.at(-1) ? tx : p.x}`
    })
    return `${d} V ${ty}`
}

/**
 * Same-category prerequisites of n, minus those already reached through another one: if A
 * requires B and C, and B requires C, only A→B→C is drawn. The skipped A→C line would run
 * down past B's row and read as belonging to whatever skill it passes.
 */
function directPrerequisites(n, ownIds, byId) {
    const prerequisites = n.prerequisite_ids.filter(id => ownIds.has(id))
    const reachable = (from, to, seen = new Set()) =>
        byId.get(from).prerequisite_ids.some(id => ownIds.has(id) && !seen.has(id) && (seen.add(id), id === to || reachable(id, to, seen)))
    return prerequisites.filter(id => !prerequisites.some(other => other !== id && reachable(other, id)))
}

/** Prerequisites of n that live in another category: [{ title, category, completed }]. */
function externalPrerequisites(n, ownIds, nodes, categoryNames) {
    return n.prerequisite_ids
        .filter(id => !ownIds.has(id))
        .map(id => nodes.find(p => p.id === id))
        .filter(Boolean)
        .map(p => ({ title: p.title, category: categoryNames.get(p.category_id), completed: p.status === 'completed' }))
}

/**
 * Gold dashed bezier links between categories, built when both ends are visible. They cut
 * across the other trees, so the page only shows the ones touching the hovered/selected skill.
 */
function crossEdges(nodes, visibleIds) {
    const byId = new Map(nodes.map(n => [n.id, n]))
    return nodes
        .filter(n => visibleIds.has(n.id))
        .flatMap(n =>
            n.prerequisite_ids
                .filter(id => visibleIds.has(id) && byId.get(id).category_id !== n.category_id)
                .map(id => {
                    const lit = byId.get(id).status === 'completed'
                    return {
                        id: `x-${id}-${n.id}`,
                        // Same direction as in-category edges: from the skill down to its prerequisite.
                        source: skillId(n.id),
                        target: skillId(id),
                        type: 'default',
                        zIndex: 1,
                        data: { cross: true, ends: [skillId(n.id), skillId(id)] },
                        animated: lit && n.status === 'in_progress',
                        style: lit
                            ? { stroke: '#dcb85c', strokeWidth: 2.5, strokeDasharray: '8 5', filter: 'drop-shadow(0 0 4px #dcb85c)' }
                            : { stroke: 'var(--color-gold-700)', strokeWidth: 2, strokeDasharray: '3 6', opacity: 0.7 },
                    }
                }),
        )
}

function position(g, id, size) {
    const { x, y } = g.node(id)
    // dagre gives centres; React Flow wants the top-left corner.
    return { position: { x: x - size.width / 2, y: y - size.height / 2 }, width: size.width, height: size.height }
}

/**
 * Build React Flow nodes/edges. One dagre layout per category, laid out side by side.
 * variant: 'card' | 'medallion' (skill node look, which changes its size).
 * allCategories: every category (names for cross-category badges), defaults to the visible ones.
 */
export function buildGraph(categories, nodes, variant = 'card', allCategories = categories) {
    const categoryNames = new Map(allCategories.map(c => [c.id, c.name]))
    let offsetX = 0
    const result = { nodes: [], edges: [] }

    for (const category of categories) {
        const laid = layoutCategory(category, nodes, variant, categoryNames)
        laid.nodes.forEach(n => (n.position.x += offsetX))
        laid.edges.forEach(e => (e.data.points = e.data.points.map(p => ({ ...p, x: p.x + offsetX }))))
        result.nodes.push(...laid.nodes)
        result.edges.push(...laid.edges)
        offsetX += laid.width + CATEGORY_GAP
    }

    const visibleCategoryIds = new Set(categories.map(c => c.id))
    const visibleIds = new Set(nodes.filter(n => visibleCategoryIds.has(n.category_id)).map(n => n.id))
    result.edges.push(...crossEdges(nodes, visibleIds))

    return result
}
