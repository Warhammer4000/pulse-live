# PulseLive Design System

## Core Principle
Dark-first, premium SaaS aesthetic. Every surface should feel intentional — deep backgrounds, violet accent system, subtle glow effects, and crisp typography.

## Color Palette

### Backgrounds
- Page background: `bg-[#080810]` (near-black with a blue tint)
- Surface / card: `bg-white/5` with `border border-white/8`
- Elevated surface: `bg-white/8` with `border border-white/12`
- Highlighted / active: `bg-violet-500/10` with `border border-violet-500/30`

### Text
- Primary text: `text-white`
- Secondary text: `text-white/60`
- Muted / labels: `text-white/40`
- Accent label (section eyebrow): `text-violet-400 text-sm font-medium tracking-widest uppercase`

### Accent Colors
- Primary action: `bg-violet-600 hover:bg-violet-500` — buttons, CTAs, active states
- Gradient text: `bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent`
- Success / live indicator: `text-emerald-400`, `bg-emerald-400`
- Destructive: `text-red-400`, `bg-red-500/10 border-red-500/20`

### Borders
- Default: `border-white/8`
- Subtle: `border-white/5`
- Active/hover: `border-white/15` or `border-violet-500/30`

## Typography

- Font stack: Space Grotesk (headings), Inter (body), JetBrains Mono (code/numbers)
- Page title: `text-3xl font-bold tracking-tight text-white`
- Section heading: `text-4xl sm:text-5xl font-bold tracking-tight`
- Card title: `text-lg font-semibold text-white`
- Body: `text-white/60 text-sm leading-relaxed`
- Eyebrow label: `text-sm font-medium text-violet-400 tracking-widest uppercase`
- Stat number: `text-2xl font-bold font-mono text-white`

## Components

### Buttons
- Primary: `bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-lg shadow-violet-900/40`
- Secondary/Ghost: `bg-white/8 hover:bg-white/12 text-white border border-white/10`
- Destructive: `bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20`
- Ghost nav: `text-white/60 hover:text-white hover:bg-white/8`

### Cards
- Default: `rounded-2xl border border-white/8 bg-white/5 p-6`
- Hover: add `hover:border-white/15 hover:bg-white/8 transition-all duration-200`
- Highlighted: `border-violet-500/30 bg-violet-500/10`
- Dashed empty state: `border border-dashed border-white/10 bg-transparent`

### Inputs
- Base: `bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500/50 focus:ring-violet-500/20`

### Badges / Pills
- Default: `rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60`
- Active/Live: `rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5`
- Violet: `rounded-full bg-violet-500/15 border border-violet-500/20 text-violet-400 text-xs px-2 py-0.5`

### Navigation (Sidebar)
- Background: `bg-[#080810] border-r border-white/5`
- Nav item default: `text-white/50 hover:text-white hover:bg-white/5`
- Nav item active: `text-violet-400 bg-violet-500/10 border-r-2 border-violet-500`

### Stat Cards
```tsx
<div className="rounded-2xl border border-white/8 bg-white/5 p-5">
  <div className="flex items-center gap-4">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
      <Icon className="h-5 w-5 text-violet-400" />
    </div>
    <div>
      <p className="text-2xl font-bold font-mono text-white">{value}</p>
      <p className="text-xs text-white/40">{label}</p>
    </div>
  </div>
</div>
```

## Layout

### Page wrapper (dashboard inner pages)
```tsx
<div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
```

### Section dividers
Use `border-t border-white/5` — never heavy borders.

### Spacing
- Between sections: `space-y-8` or `py-8`
- Card padding: `p-6` (default), `p-8` (feature cards)
- Gap between grid items: `gap-4` or `gap-5`

## Backgrounds & Glows

### Radial glow (hero/CTA sections)
```tsx
<div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(139,92,246,0.25),transparent)]" />
```

### Grid overlay
```tsx
<div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />
<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#080810_100%)]" />
```

### Ambient blob
```tsx
<div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
```

## Animation

Use `framer-motion` consistently:

```ts
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};
```

- Page entry: `initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}`
- Card list: use `AnimatePresence` with `layout` prop for add/remove
- Skeleton loading: use `bg-white/5 animate-pulse rounded-xl`

## Live / Status Indicators
```tsx
<span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
  Live
</span>
```

## Empty States
```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <Icon className="mb-4 h-10 w-10 text-white/20" />
  <p className="text-white/60 font-medium">No items yet</p>
  <p className="text-white/30 text-sm mt-1">Subtitle text here</p>
</div>
```

## Do's and Don'ts
- DO use `text-white/X` opacity variants for text hierarchy
- DO keep backgrounds dark — never use `bg-background` (light mode variable) in new pages
- DO use `rounded-2xl` for cards, `rounded-xl` for smaller elements, `rounded-lg` for inputs/buttons
- DO add subtle `shadow-lg shadow-violet-900/40` to primary action buttons
- DON'T use `gradient-text`, `glass-card`, `gradient-bg` CSS classes (legacy light-mode only)
- DON'T use hard white or black — always use opacity variants
- DON'T use colored backgrounds for entire sections — use radial glows instead
