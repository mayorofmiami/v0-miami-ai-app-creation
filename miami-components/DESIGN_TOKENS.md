# Miami.ai Design System

## Colors (Preserve These Exactly)

### Brand Colors
- Primary Cyan: `#00ffff` / `rgb(0, 255, 255)`
- Primary Pink: `#ff00ff` / `rgb(255, 0, 255)`
- Accent Blue: `#0ea5e9`

### Backgrounds
- Dark Base: `#0a0a0a`
- Card Background: `#1a1a1a`
- Elevated: `#2a2a2a`

### Text
- Primary: `#ffffff`
- Secondary: `#a1a1aa`
- Muted: `#71717a`

### Borders
- Default: `#27272a`
- Accent: `#3f3f46`

## Typography

### Fonts
- Sans: Inter, system-ui
- Mono: 'Fira Code', monospace

### Sizes
- Hero: `text-5xl` / `text-6xl`
- Heading: `text-3xl` / `text-4xl`
- Subheading: `text-xl` / `text-2xl`
- Body: `text-base`
- Small: `text-sm`

## Spacing Scale
- xs: `0.5rem` (2)
- sm: `0.75rem` (3)
- md: `1rem` (4)
- lg: `1.5rem` (6)
- xl: `2rem` (8)
- 2xl: `3rem` (12)

## Effects

### Shadows
- Glow: `0 0 20px rgba(0, 255, 255, 0.5)`
- Card: `shadow-lg`
- Elevated: `shadow-2xl`

### Animations
- Hover transition: `transition-all duration-300`
- Fade in: `animate-in fade-in`
- Slide up: `animate-in slide-in-from-bottom-4`

## Components to Preserve

### Glassmorphism Cards
\`\`\`tsx
className="backdrop-blur-xl bg-white/5 border border-white/10"
\`\`\`

### Neon Glow Text
\`\`\`tsx
className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-600"
\`\`\`

### Gradient Buttons
\`\`\`tsx
className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
