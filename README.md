# Krish Gopi — Spider-Verse Portfolio

A maximalist, comic-book portfolio: a spider-hero swings across a WebGL night city as you scroll.

**Stack:** Vite · React 19 · TypeScript · three.js / @react-three/fiber · Lenis smooth scroll · GSAP

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

Option A: push to GitHub, then import the repo at https://vercel.com/new. Vercel detects Vite automatically (`vercel.json` also pins the build command and `dist` output).

Option B: with the Vercel CLI:

```bash
npx vercel --prod
```

## Project layout

| Path | What lives there |
| --- | --- |
| `src/data/portfolio.ts` | **All copy**: profile, skills, projects, interests, section list. Edit this to update content. |
| `src/store/scroll.ts` | Lenis smooth scroll + shared, render-free `scrollState` read by every layer. |
| `src/scene/` | WebGL night city (z-layer 0), camera flies through it with scroll. |
| `src/sections/` | Comic-panel content sections (z-layer 10). |
| `src/hero/` | The swinging spider-hero overlay (z-layer 30), driven by scroll position. |
| `src/ui/` | HUD: nav, scroll progress, intro loader (z-layer 50). |
| `src/styles/tokens.css` | Palette, fonts, z-index tokens. |

Before deploying, replace the placeholder GitHub/LinkedIn URLs in `src/data/portfolio.ts`.

The character and emblems are original artwork drawn in code, inspired by the Spider-Verse comic style; no official Marvel assets are used.
