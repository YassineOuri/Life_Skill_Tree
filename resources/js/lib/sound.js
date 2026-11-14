/**
 * Game sounds synthesised with the Web Audio API: no audio files to ship or license.
 * The AudioContext is created lazily on the first sound (after a user action), and every
 * failure is silent: sound is a bonus, never a reason for an error.
 */

export const SOUND_PREFERENCE = 'skill-tree.sound' // 'on' | 'off', shared with the header toggle

let ctx = null

export function isMuted() {
    try {
        return localStorage.getItem(SOUND_PREFERENCE) === 'off'
    } catch {
        return false
    }
}

function audio() {
    if (isMuted()) return null
    try {
        ctx ??= new (window.AudioContext || window.webkitAudioContext)()
        if (ctx.state === 'suspended') ctx.resume()
        return ctx
    } catch {
        return null
    }
}

/** One enveloped oscillator note. Times are in seconds from now. */
function note(ac, { freq, at = 0, duration = 0.25, type = 'sine', gain = 0.12, slideTo }) {
    const start = ac.currentTime + at
    const osc = ac.createOscillator()
    const env = ac.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration)
    env.gain.setValueAtTime(0.0001, start)
    env.gain.exponentialRampToValueAtTime(gain, start + 0.012)
    env.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    osc.connect(env).connect(ac.destination)
    osc.start(start)
    osc.stop(start + duration + 0.05)
}

function play(notes) {
    const ac = audio()
    if (!ac) return
    try {
        notes.forEach(n => note(ac, n))
    } catch {
        // ignore
    }
}

// Note frequencies (Hz)
const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, E6 = 1318.5, G6 = 1568

export const sounds = {
    /** Quest step checked: short soft tick. */
    tick: () => play([{ freq: 1200, duration: 0.07, type: 'triangle', gain: 0.07, slideTo: 900 }]),

    /** Skill unlocked: rising shimmer. */
    unlock: () =>
        play([
            { freq: E5, duration: 0.3, type: 'triangle', gain: 0.09 },
            { freq: G5, at: 0.07, duration: 0.3, type: 'triangle', gain: 0.08 },
            { freq: E6, at: 0.14, duration: 0.5, type: 'sine', gain: 0.06 },
        ]),

    /** Skill completed: short fanfare. */
    complete: () =>
        play([
            ...[C5, E5, G5].map((freq, i) => ({ freq, at: i * 0.1, duration: 0.18, type: 'square', gain: 0.045 })),
            { freq: C6, at: 0.3, duration: 0.6, type: 'square', gain: 0.05 },
            { freq: C6, at: 0.3, duration: 0.8, type: 'sine', gain: 0.08 },
        ]),

    /** Character level up: bigger arpeggio ending on a held chord. */
    levelUp: () =>
        play([
            ...[C5, E5, G5, C6, E6].map((freq, i) => ({ freq, at: i * 0.09, duration: 0.2, type: 'square', gain: 0.04 })),
            ...[C6, E6, G6].map(freq => ({ freq, at: 0.5, duration: 1.2, type: 'triangle', gain: 0.06 })),
        ]),
}
