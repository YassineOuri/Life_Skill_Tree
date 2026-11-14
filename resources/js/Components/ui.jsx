/**
 * Game-style UI primitives: polygon frames, hex medallions, chamfered buttons.
 * Borders are drawn by stacking an outer clipped layer (the frame) over an inner one (the face),
 * because clip-path cuts off regular CSS borders and box-shadows.
 */

export function Frame({ className = '', frameClass = 'metal-dark', faceClass = 'stone', cut = 10, inset = 2, style, faceStyle, children }) {
    return (
        <div className={`chamfer ${frameClass} ${className}`} style={{ '--c': `${cut}px`, padding: inset, ...style }}>
            <div className={`chamfer relative h-full w-full ${faceClass}`} style={{ '--c': `${Math.max(cut - inset, 2)}px`, ...faceStyle }}>
                {children}
            </div>
        </div>
    )
}

export function Hex({ size = 52, frameClass = 'metal-gold', frameStyle, faceStyle, children, className = '' }) {
    return (
        <div
            className={`hex flex shrink-0 items-center justify-center ${frameClass} ${className}`}
            style={{ width: size, height: size * 1.12, ...frameStyle }}
        >
            <div
                className="hex flex items-center justify-center bg-ink-950"
                style={{ width: size - 6, height: (size - 6) * 1.12, ...faceStyle }}
            >
                {children}
            </div>
        </div>
    )
}

const BUTTON_VARIANTS = {
    gold: { frame: 'metal-gold', face: 'metal-gold', text: 'text-[var(--on-gold)]' },
    dark: { frame: 'metal-dark', face: 'stone', text: 'text-parchment hover:text-gold-300' },
    danger: { frame: 'bg-[var(--danger-frame)]', face: 'bg-[var(--danger-face)]', text: 'text-[var(--danger-text)] hover:brightness-125' },
}

export function GameButton({ variant = 'dark', active = false, className = '', children, style, ...props }) {
    const v = BUTTON_VARIANTS[active ? 'gold' : variant]
    return (
        <button
            {...props}
            className={`chamfer group p-px transition disabled:cursor-not-allowed ${active ? '' : 'disabled:opacity-40'} ${v.frame} ${className}`}
            style={{ '--c': '7px', ...style }}
        >
            <span
                className={`chamfer flex h-full items-center justify-center gap-2 px-3 py-1.5 text-sm font-bold uppercase tracking-wider ${v.face} ${v.text}`}
                style={{ '--c': '6px' }}
            >
                {children}
            </span>
        </button>
    )
}

export function SectionTitle({ children }) {
    return (
        <h3 className="ornament mb-3 font-display text-[11px] font-bold uppercase tracking-[0.25em] text-gold-500">
            {children}
        </h3>
    )
}

export const inputClass =
    'w-full border border-ink-600 bg-ink-950/80 px-3 py-2 text-sm font-medium text-parchment placeholder-ink-600 focus:border-gold-500 focus:outline-none'

export function Field({ label, error, children }) {
    return (
        <label className="block">
            <span className="mb-1 block font-display text-[10px] font-bold uppercase tracking-[0.2em] text-gold-600">{label}</span>
            {children}
            {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
        </label>
    )
}

/** One-shot unlock/completion effect. Re-mount it (via key) to replay. */
export function Burst({ color }) {
    return (
        <div className="pointer-events-none absolute inset-0" style={{ '--glow': color }}>
            <span className="burst burst-rays" />
            <span className="burst burst-ring" />
            <span className="burst burst-ring delay" />
        </div>
    )
}
