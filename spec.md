# ByteWay / ChatWave - Smooth Animations & UI Enhancement

## Current State
The app is a full Spider-Man themed (red/navy blue) blog + chat + video + downloads platform. It already has:
- Basic animate-in/fade-in classes in index.css
- Some motion/react animations on VideosPage card entrances
- Spider web animations on header logo
- Luna chatbot pulse animation
- Footer divider glow animations
- Clock glow animations

## Requested Changes (Diff)

### Add
- Page transition animations: smooth fade+slide when navigating between pages
- Scroll-reveal animations: elements animate in as they enter viewport (use Intersection Observer)
- Staggered card entrance animations on Blog list, Videos grid, Downloads grid
- Particle/web-thread floating background effect on HomePage hero section
- Animated gradient shimmer on hero heading text
- Hover micro-interactions: cards lift with glow, buttons ripple, nav links spark
- Animated spider-web SVG background pattern subtly moving on HomePage
- Smooth page loader/progress bar at top on navigation
- Floating particle dots (web-strand style) as ambient background
- Pulse glow on CTA buttons
- ByteWay header: animated underline on active nav link, logo hover spin enhanced
- Footer: enhanced social icon hover with glow pop
- ByteChat: smoother message bubble entrance (slide in from side)
- Luna chatbot button: more elaborate spider-web radiate animation on open

### Modify
- index.css: add comprehensive animation keyframes (float, shimmer, particle-drift, web-strand, glow-pulse, ripple, spin-slow)
- HomePage: add scroll-reveal wrapper utility, enhance hero with animated particles
- Layout.tsx: wrap main content with smoother page transition
- ByteWayHeader: enhanced active link indicator animation
- All page grids/cards: staggered entrance with delay

### Remove
- Nothing removed

## Implementation Plan
1. Enhance index.css with 15+ new animation keyframes: shimmer, float, particle-drift, glow-pulse, ripple, web-radiate, slide-up-fade, bounce-in, spin-slow, gradient-flow
2. Add a ScrollReveal wrapper component that uses IntersectionObserver to trigger animate-in classes
3. Update HomePage hero with floating spider-web particle background (pure CSS/SVG, no JS library)
4. Update Layout.tsx main content transition to use smooth fade+translate
5. Update BlogListPage, VideosPage, DownloadsPage cards with staggered entrance
6. Add animated gradient shimmer to hero h1 text
7. Enhance button hover states with glow/ripple
8. Enhance ByteChat message bubbles with slide-in from side
9. Luna chatbot floating button: add web-radiate rings on hover/open
10. Validate and build
