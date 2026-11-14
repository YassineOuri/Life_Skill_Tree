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
            type: 'step',
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
            n.prerequisite_ids
                .filter(id => ownIds.has(id))
                .map(id => edge(skillId(n.id), byId.get(id), byId.get(id).status === 'completed', n.status === 'in_progress')),
        ),
    ]

    dagre.layout(g)

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

/** Prerequisites of n that live in another category: [{ title, category, completed }]. */
function externalPrerequisites(n, ownIds, nodes, categoryNames) {
    return n.prerequisite_ids
        .filter(id => !ownIds.has(id))
        .map(id => nodes.find(p => p.id === id))
        .filter(Boolean)
        .map(p => ({ title: p.title, category: categoryNames.get(p.category_id), completed: p.status === 'completed' }))
}

/** Gold dashed bezier links between categories, drawn only when both ends are visible. */
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
        result.nodes.push(...laid.nodes)
        result.edges.push(...laid.edges)
        offsetX += laid.width + CATEGORY_GAP
    }

    const visibleCategoryIds = new Set(categories.map(c => c.id))
    const visibleIds = new Set(nodes.filter(n => visibleCategoryIds.has(n.category_id)).map(n => n.id))
    result.edges.push(...crossEdges(nodes, visibleIds))

    return result
}
