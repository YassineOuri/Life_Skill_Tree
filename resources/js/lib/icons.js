/**
 * Curated icon set, bundled for instant rendering and browsing. Every other lucide icon is
 * also usable: it is lazy-loaded by name through lucide's DynamicIcon (one small chunk per
 * icon), so the full ~2000-icon set is never shipped up front. Names are lucide kebab-case
 * names, as stored in the database.
 */
import { createElement } from 'react'
import { DynamicIcon, iconNames } from 'lucide-react/dynamic'
import {
    Activity,
    Apple,
    Award,
    Baby,
    Banknote,
    Bed,
    Bike,
    Book,
    BookOpen,
    Brain,
    Briefcase,
    Brush,
    Bug,
    Building2,
    Calculator,
    Calendar,
    Camera,
    ChartLine,
    ChefHat,
    Clock,
    Cloud,
    Code,
    Coins,
    Compass,
    Container,
    Cpu,
    Crown,
    Database,
    Dice5,
    Dog,
    Dumbbell,
    Film,
    Flag,
    Flame,
    FlaskConical,
    Footprints,
    Gamepad2,
    Gem,
    GitBranch,
    Globe,
    GraduationCap,
    Guitar,
    Handshake,
    Headphones,
    Heart,
    HeartPulse,
    House,
    Landmark,
    Languages,
    Laptop,
    Layers,
    Leaf,
    Library,
    Lightbulb,
    LockKeyhole,
    Map as MapIcon,
    Medal,
    Moon,
    Mountain,
    Music,
    Network,
    NotebookPen,
    Palette,
    PenTool,
    PiggyBank,
    Plane,
    Presentation,
    Puzzle,
    Receipt,
    Rocket,
    Salad,
    ScrollText,
    Server,
    Shield,
    ShipWheel,
    Sparkles,
    Sprout,
    Star,
    Sun,
    Target,
    Tent,
    Terminal,
    Timer,
    TrendingUp,
    Trophy,
    User,
    Users,
    Wallet,
    Waves,
    Zap,
} from 'lucide-react'

export const ICON_GROUPS = {
    Career: {
        briefcase: Briefcase,
        'building-2': Building2,
        laptop: Laptop,
        code: Code,
        terminal: Terminal,
        server: Server,
        cloud: Cloud,
        database: Database,
        cpu: Cpu,
        'git-branch': GitBranch,
        container: Container,
        'ship-wheel': ShipWheel,
        layers: Layers,
        network: Network,
        shield: Shield,
        'lock-keyhole': LockKeyhole,
        bug: Bug,
        rocket: Rocket,
        presentation: Presentation,
        handshake: Handshake,
    },
    Learning: {
        'graduation-cap': GraduationCap,
        book: Book,
        'book-open': BookOpen,
        library: Library,
        award: Award,
        medal: Medal,
        trophy: Trophy,
        'scroll-text': ScrollText,
        brain: Brain,
        lightbulb: Lightbulb,
        languages: Languages,
        'pen-tool': PenTool,
        'notebook-pen': NotebookPen,
        'flask-conical': FlaskConical,
        calculator: Calculator,
        globe: Globe,
    },
    Health: {
        'heart-pulse': HeartPulse,
        heart: Heart,
        dumbbell: Dumbbell,
        footprints: Footprints,
        bike: Bike,
        waves: Waves,
        mountain: Mountain,
        apple: Apple,
        salad: Salad,
        moon: Moon,
        bed: Bed,
        flag: Flag,
        timer: Timer,
        activity: Activity,
    },
    Finance: {
        'piggy-bank': PiggyBank,
        wallet: Wallet,
        coins: Coins,
        banknote: Banknote,
        'trending-up': TrendingUp,
        'chart-line': ChartLine,
        landmark: Landmark,
        house: House,
        receipt: Receipt,
        gem: Gem,
    },
    Hobbies: {
        'gamepad-2': Gamepad2,
        music: Music,
        guitar: Guitar,
        camera: Camera,
        palette: Palette,
        brush: Brush,
        film: Film,
        'chef-hat': ChefHat,
        plane: Plane,
        map: MapIcon,
        tent: Tent,
        puzzle: Puzzle,
        'dice-5': Dice5,
        headphones: Headphones,
    },
    Misc: {
        star: Star,
        sparkles: Sparkles,
        target: Target,
        compass: Compass,
        crown: Crown,
        flame: Flame,
        zap: Zap,
        users: Users,
        user: User,
        baby: Baby,
        dog: Dog,
        sprout: Sprout,
        leaf: Leaf,
        sun: Sun,
        calendar: Calendar,
        clock: Clock,
    },
}

const ICONS = Object.assign({}, ...Object.values(ICON_GROUPS))

/** Every lucide icon name, curated ones included. */
export const ALL_ICON_NAMES = iconNames
const ALL = new Set(iconNames)

export const isCuratedIcon = name => Boolean(name && ICONS[name.trim()])
export const isKnownIcon = name => Boolean(name && (ICONS[name.trim()] || ALL.has(name.trim())))

// One stable wrapper component per lazy icon, so re-renders don't remount (and refetch) it.
const lazyIcons = new Map()
function lazyIcon(name) {
    if (!lazyIcons.has(name)) {
        const LazyIcon = props => createElement(DynamicIcon, { name, fallback: () => createElement(Sparkles, props), ...props })
        LazyIcon.displayName = `LazyIcon(${name})`
        lazyIcons.set(name, LazyIcon)
    }
    return lazyIcons.get(name)
}

/** Resolve an icon from its kebab-case name ("heart-pulse"), falling back to Sparkles. */
export function getIcon(name) {
    const key = name?.trim()
    if (!key) return Sparkles
    if (ICONS[key]) return ICONS[key]
    return ALL.has(key) ? lazyIcon(key) : Sparkles
}
