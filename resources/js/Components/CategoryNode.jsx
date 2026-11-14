import { Handle, Position } from '@xyflow/react'
import { getIcon } from '../lib/icons'
import { levelPercent } from '../lib/progression'
import { Frame, Hex } from './ui'

export default function CategoryNode({ data }) {
    const { category, progress, selected } = data
    const Icon = getIcon(category.icon)
    const pct = levelPercent(category)
    const color = category.color

    return (
        <div
            className="relative h-[86px] w-[230px] cursor-pointer transition duration-200 hover:-translate-y-0.5"
            style={{
                filter: selected
                    ? 'drop-shadow(0 0 2px #f7e7b4) drop-shadow(0 0 12px #dcb85c)'
                    : `drop-shadow(0 0 12px ${color}66)`,
            }}
        >
            <Frame
                cut={18}
                inset={3}
                className="h-full w-full"
                frameClass="metal-gold"
                faceStyle={{
                    background: `radial-gradient(ellipse at 15% 50%, ${color}40, transparent 70%), linear-gradient(180deg, var(--color-ink-800), var(--color-ink-950))`,
                }}
            >
                <div className="flex h-full items-center gap-3 px-3">
                    <Hex
                        size={56}
                        frameClass="metal-gold"
                        faceStyle={{ background: `radial-gradient(circle at 50% 35%, ${color}, ${color}66 70%, var(--medal-shade))` }}
                    >
                        <Icon size={24} className="text-[var(--on-gold)]" strokeWidth={2.4} />
                    </Hex>

                    <div className="min-w-0 flex-1">
                        <div className="text-gold truncate font-display text-[15px] font-extrabold uppercase tracking-[0.12em]">
                            {category.name}
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                            <div
                                className="chamfer metal-dark h-2 flex-1 p-px"
                                style={{ '--c': '3px' }}
                                title={`${category.xp - category.floor} / ${category.next - category.floor} XP to level ${category.level + 1}`}
                            >
                                <div className="chamfer h-full bg-ink-950" style={{ '--c': '2px' }}>
                                    <div
                                        className="h-full"
                                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, #eed58a)` }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mt-1 flex justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-parchment-dim">
                            <span>Lv. {category.level}</span>
                            <span>
                                {progress.done}/{progress.total} · {category.xp} XP
                            </span>
                        </div>
                    </div>
                </div>
            </Frame>
            <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
        </div>
    )
}
