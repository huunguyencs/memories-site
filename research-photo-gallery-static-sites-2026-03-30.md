# Modern Static Photo Gallery & Memory Website — Comprehensive Research Report

## Executive Summary

Building an elegant, Apple-inspired photo memory website in 2026 is highly achievable with the modern web stack. **Astro** is the strongest recommendation for this use case: it produces zero-JavaScript HTML by default, supports native View Transitions for silky page-to-page animations, integrates directly with Cloudinary via the official `astro-cloudinary` package, and deploys to GitHub Pages with a single GitHub Actions workflow. For teams or developers more comfortable with React, **Next.js** with `next-cloudinary` and **Framer Motion** is a proven, well-documented alternative.

The core design philosophy for an Apple-style memory site is: white space is your friend, the system font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI"`) gives you SF Pro for free on Apple devices, `aspect-ratio` + `object-cover` Tailwind classes keep every photo perfectly cropped, and CSS View Transitions or Framer Motion layout animations deliver the native-app feel. Albums (e.g., "Da Lat 2026", "Summer 2025") map directly to Astro content collections or Cloudinary folders — one folder per trip, one markdown file per album.

The most complete ready-to-use open-source template matching all your requirements is **Memori** (`codewithnemo/memori`): Astro + Tailwind + Svelte + Cloudinary + timeline view + light/dark mode + Fancybox lightbox. It was explicitly inspired by the Fuwari blog theme and deploys to GitHub Pages out of the box.

---

## Table of Contents

1. [Introduction & Context](#1-introduction--context)
2. [Core Concepts & Fundamentals](#2-core-concepts--fundamentals)
3. [Technical Deep Dive — Frameworks](#3-technical-deep-dive--frameworks)
4. [Cloudinary Integration](#4-cloudinary-integration)
5. [Apple-Style Design System](#5-apple-style-design-system)
6. [Animation Techniques](#6-animation-techniques)
7. [Curated Open-Source Repositories](#7-curated-open-source-repositories)
8. [Comparative Analysis](#8-comparative-analysis)
9. [Best Practices & Implementation Guide](#9-best-practices--implementation-guide)
10. [GitHub Pages Deployment](#10-github-pages-deployment)
11. [Common Challenges & Solutions](#11-common-challenges--solutions)
12. [Community & Ecosystem](#12-community--ecosystem)
13. [Getting Started Guide](#13-getting-started-guide)
14. [Appendices](#appendices)
15. [Conclusion](#conclusion)

---

## 1. Introduction & Context

### What This Research Covers

This report answers a specific need: build a personal, static photo memory site that:
- Groups photos by trip or event (e.g., "Da Lat 2026", "Ha Noi Winter")
- Uses card-based album covers on a home page
- Has smooth, native-app-like transitions between pages
- Stores photos on Cloudinary (no Git-stored images)
- Deploys for free to GitHub Pages
- Looks like Apple Photos met a design-conscious developer

### Why This Matters in 2026

The browser platform has matured dramatically. The **View Transitions API** now has >85% browser support (Chrome 111+, Edge 111+, Safari 18+). **CSS `aspect-ratio`** and **`object-fit`** are universally supported. **Astro's** zero-JS model means a photo gallery page loads as fast as static HTML while still feeling like a SPA. **Cloudinary's** free tier (25 GB storage, 25 GB monthly bandwidth) is more than sufficient for a personal memory site.

---

## 2. Core Concepts & Fundamentals

### 2.1 Static Site Generators (SSGs) vs. Dynamic Apps

For a personal photo memory site, a **static site generator** is the right choice:

| Property | SSG (Astro/Next.js static export) | Dynamic App (Node server) |
|---|---|---|
| Hosting cost | Free (GitHub Pages, Netlify, Vercel) | Requires server |
| Performance | Instant CDN delivery | Server round-trip |
| Security | No attack surface | Requires hardening |
| Build step | Yes, on push or manually | No |
| Image URLs | Cloudinary CDN (external) | Can be local |

### 2.2 Album Architecture Mental Model

The recommended mental model maps 1:1 between file system and URL:

```
/                     → Album grid (card for each trip)
/albums/da-lat-2026   → Photo grid for that trip
/albums/da-lat-2026/3 → Full-screen lightbox for photo #3
```

In **Astro**, this maps to:
```
src/content/galleries/
  da-lat-2026/
    index.md          ← title, date, cover, description
  summer-2025/
    index.md
```

Images live in Cloudinary folders:
```
cloudinary://galleries/da-lat-2026/
cloudinary://galleries/summer-2025/
```

### 2.3 Image Delivery Pipeline

```
User browser
  ↓ request /albums/da-lat-2026
Astro static HTML (from CDN)
  ↓ <img src="https://res.cloudinary.com/…/f_auto,q_auto,w_720/…">
Cloudinary CDN
  ↓ serves WebP (or AVIF) at correct width
  ↓ blur placeholder shown until loaded (base64 LQIP)
Full image appears
```

The key transformations in every Cloudinary URL:
- `f_auto` — serve WebP to modern browsers, JPEG to old ones
- `q_auto` — automatic quality compression (typically 60-80%)
- `w_720` (or `w_1280`) — resize to display width
- `e_blur:300,q_1,w_50` — generate a 50px blur placeholder

---

## 3. Technical Deep Dive — Frameworks

### 3.1 Astro (Recommended)

**Repository:** https://github.com/withastro/astro
**Deploy to GitHub Pages:** https://docs.astro.build/en/guides/deploy/github/
**Version (2026):** Astro 5.x

#### Why Astro Wins for Photo Galleries

1. **Zero JavaScript by default** — Gallery pages are pure HTML+CSS; JavaScript only loads for interactive islands (lightbox, search)
2. **Content Collections** — Type-safe YAML/Markdown frontmatter for album metadata with schema validation
3. **Built-in `<Image />` component** — Automatic format conversion, responsive `srcset`, lazy loading
4. **Native View Transitions** — Add `<ViewTransitions />` to your layout and get cross-page animations for free
5. **GitHub Pages support** — Official `@astrojs/github-pages` action
6. **Cloudinary integration** — Official `astro-cloudinary` package from Cloudinary

#### Astro Content Collection Schema for Albums

```typescript
// src/content/config.ts
import { z, defineCollection } from 'astro:content';

const galleries = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),                    // "Đà Lạt 2026"
    date: z.date(),                        // 2026-01-15
    description: z.string().optional(),
    location: z.string().optional(),       // "Đà Lạt, Vietnam"
    cover: z.string(),                     // Cloudinary public_id
    camera: z.string().optional(),         // "iPhone 16 Pro"
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = { galleries };
```

#### Dynamic Route for Album Pages

```astro
---
// src/pages/albums/[slug].astro
import { getCollection } from 'astro:content';
import { v2 as cloudinary } from 'cloudinary';

export async function getStaticPaths() {
  const galleries = await getCollection('galleries');
  return galleries.map(g => ({ params: { slug: g.id } }));
}

const { slug } = Astro.params;
const gallery = await getEntry('galleries', slug);

// Fetch images from Cloudinary folder
const result = await cloudinary.api.resources({
  type: 'upload',
  prefix: `galleries/${slug}`,
  max_results: 500,
});
const photos = result.resources;
---
```

#### View Transitions Setup (2 lines)

```astro
---
// src/layouts/BaseLayout.astro
import { ViewTransitions } from 'astro:transitions';
---
<html>
  <head>
    <ViewTransitions />
  </head>
  ...
</html>
```

Then tag individual elements for morphing animations:

```astro
<!-- Album card on index page -->
<img transition:name={`cover-${album.id}`} src={album.coverUrl} />

<!-- Same image on album detail page -->
<img transition:name={`cover-${slug}`} src={coverUrl} />
```

Astro automatically morphs the cover image from the card position into the header of the album page — exactly like the iOS "hero" animation.

### 3.2 Next.js (Alternative)

**Repository:** https://github.com/vercel/next.js
**Cloudinary Template:** https://github.com/vercel/next.js/tree/canary/examples/with-cloudinary

#### When to Choose Next.js Over Astro

- You already know React
- You want Framer Motion's layout animations (more expressive than CSS View Transitions)
- You want server-side features (upload form, protected albums)
- You prefer TypeScript with React component patterns

#### Static Export for GitHub Pages

```javascript
// next.config.js
const nextConfig = {
  output: 'export',           // generates /out folder
  images: {
    unoptimized: true,         // required for static export
    // OR use Cloudinary as loader:
    loader: 'custom',
    loaderFile: './cloudinary-loader.js',
  },
};
```

#### Cloudinary Loader

```javascript
// cloudinary-loader.js
export default function cloudinaryLoader({ src, width, quality }) {
  const params = [
    'f_auto',
    'c_limit',
    `w_${width}`,
    `q_${quality || 'auto'}`,
  ];
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${params.join(',')}/${src}`;
}
```

### 3.3 Plain HTML + Vanilla JS

For maximum simplicity and zero build tooling:
- **Thumbsup** (CLI static gallery generator): Point at a folder, get a complete site
- **Fussel** (Python + React): More modern, Docker-deployable
- **fgallery** (shell + ImageMagick): Absolute minimal, no JS

These are appropriate if you want to drop photos into a folder and run one command, but they lack the polished Apple-style design you're after without significant CSS customization.

---

## 4. Cloudinary Integration

### 4.1 Official Packages

| Framework | Package | Source |
|---|---|---|
| Astro | `astro-cloudinary` | https://astro.cloudinary.dev/ |
| Next.js | `next-cloudinary` | https://next.cloudinary.dev/ |
| Plain React | `@cloudinary/react` | https://cloudinary.com/documentation/react_sdk |

### 4.2 Environment Variables

```bash
# .env.local (never commit this)
PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=aBcDeFgHiJkLmNoPqRsTuV
```

For GitHub Pages, add these as **Repository Secrets** in Settings → Secrets and variables → Actions.

### 4.3 Listing Images from a Folder (Node.js / Astro build time)

```javascript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: import.meta.env.CLOUDINARY_API_KEY,
  api_secret: import.meta.env.CLOUDINARY_API_SECRET,
});

async function getAlbumPhotos(albumSlug) {
  const result = await cloudinary.api.resources({
    type: 'upload',
    prefix: `galleries/${albumSlug}/`,
    max_results: 500,
    context: true,   // fetch metadata/captions
    tags: true,
  });

  return result.resources.map(r => ({
    publicId: r.public_id,
    url: r.secure_url,
    width: r.width,
    height: r.height,
    caption: r.context?.custom?.caption || '',
    // Blur placeholder:
    blurUrl: cloudinary.url(r.public_id, {
      transformation: [
        { width: 50, effect: 'blur:300', quality: 1 },
        { fetch_format: 'auto' }
      ]
    }),
  }));
}
```

### 4.4 CldImage Component (Astro)

```astro
---
import { CldImage } from 'astro-cloudinary';
---

<CldImage
  src="galleries/da-lat-2026/sunset-valley"
  width={800}
  height={600}
  alt="Sunset at Valley of Love"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  loading="lazy"
  placeholder="blur"
/>
```

### 4.5 Cloudinary Free Tier Limits (2026)

| Resource | Free Allowance |
|---|---|
| Storage | 25 GB |
| Monthly bandwidth | 25 GB |
| Transformations | 25 credits/month |
| Image uploads | Unlimited |

For a personal memory site with ~2,000 photos at ~3MB each (6GB raw), served as optimized WebP at ~150KB each, the free tier is highly sufficient.

### 4.6 Folder Organization Strategy

```
Cloudinary account
└── galleries/
    ├── da-lat-2026/
    │   ├── cover.jpg
    │   ├── valley-of-love-1.jpg
    │   └── ...
    ├── ha-noi-winter-2025/
    │   ├── cover.jpg
    │   └── ...
    └── summer-beach-2025/
        └── ...
```

Upload photos using:
```bash
# Cloudinary CLI
cloudinary uploader upload "*.jpg" folder=galleries/da-lat-2026

# Or via Node.js script
cloudinary.uploader.upload('photo.jpg', {
  folder: 'galleries/da-lat-2026',
  use_filename: true,
  unique_filename: false,
});
```

---

## 5. Apple-Style Design System

### 5.1 Typography — Getting SF Pro for Free

SF Pro is Apple's proprietary font. **You cannot legally host or serve it on your website.** However, Apple devices automatically use SF Pro when you specify the system font stack:

```css
body {
  font-family:
    -apple-system,           /* Safari, older iOS */
    BlinkMacSystemFont,       /* Chrome on macOS */
    "SF Pro Display",         /* Direct name (Apple devices only) */
    "Helvetica Neue",         /* Fallback */
    system-ui,               /* Generic system-ui */
    sans-serif;
}
```

On non-Apple devices, `system-ui` maps to:
- Windows: Segoe UI
- Android: Roboto
- Linux: Ubuntu / Cantarell

All are clean, geometric sans-serifs. The result looks native on every platform.

**Alternative free fonts with SF Pro aesthetics:**
- **Inter** (Google Fonts) — Most common SF Pro substitute, excellent at all sizes
- **Plus Jakarta Sans** — Slightly more personality
- **DM Sans** — Clean, contemporary
- **Geist** (Vercel) — Designed for developer interfaces, very modern

### 5.2 Color Palette

```css
:root {
  /* Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f7;       /* Apple's off-white */
  --bg-tertiary: #e8e8ed;

  /* Text */
  --text-primary: #1d1d1f;       /* Apple's near-black */
  --text-secondary: #6e6e73;     /* Apple's secondary gray */
  --text-tertiary: #aeaeb2;

  /* Accent */
  --accent: #0071e3;             /* Apple blue */
  --accent-hover: #0077ed;

  /* Dark mode */
  @media (prefers-color-scheme: dark) {
    --bg-primary: #000000;
    --bg-secondary: #1c1c1e;
    --bg-tertiary: #2c2c2e;
    --text-primary: #f5f5f7;
    --text-secondary: #98989d;
    --accent: #2997ff;
  }
}
```

### 5.3 Album Card Component Design

```css
.album-card {
  border-radius: 18px;          /* iOS card radius */
  overflow: hidden;
  background: var(--bg-secondary);
  cursor: pointer;

  /* Subtle shadow like iOS cards */
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.06),
    0 8px 24px rgba(0, 0, 0, 0.04);

  /* Smooth hover lift */
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.album-card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.12),
    0 20px 48px rgba(0, 0, 0, 0.08);
}

.album-card__cover {
  aspect-ratio: 4/3;            /* Consistent landscape ratio */
  overflow: hidden;
}

.album-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 400ms ease;
}

.album-card:hover .album-card__cover img {
  transform: scale(1.05);       /* Subtle zoom on hover */
}

.album-card__meta {
  padding: 16px 20px 20px;
}

.album-card__title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px;
  letter-spacing: -0.3px;       /* Apple's tighter tracking */
}

.album-card__subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.album-card__count {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 8px;
}
```

### 5.4 Photo Grid (Tailwind CSS)

```html
<!-- Album index page grid -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-8">
  {albums.map(album => (
    <a href={`/albums/${album.slug}`} class="group block">
      <div class="rounded-2xl overflow-hidden bg-gray-50 shadow-sm
                  hover:shadow-xl transition-all duration-200
                  hover:-translate-y-1">
        <div class="aspect-[4/3] overflow-hidden">
          <img
            src={album.coverUrl}
            alt={album.title}
            class="w-full h-full object-cover
                   group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
        <div class="p-4">
          <h2 class="text-[17px] font-semibold tracking-tight text-gray-900">
            {album.title}
          </h2>
          <p class="text-[13px] text-gray-500 mt-1">{album.date}</p>
          <p class="text-[12px] text-gray-400 mt-1">{album.photoCount} photos</p>
        </div>
      </div>
    </a>
  ))}
</div>
```

### 5.5 Photo Grid Inside an Album (Masonry / Justified)

```html
<!-- Inside album page — responsive masonry-like grid -->
<div class="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3 p-4 sm:p-8">
  {photos.map(photo => (
    <div class="break-inside-avoid mb-3">
      <img
        src={photo.cloudinaryUrl}
        alt={photo.caption}
        class="w-full rounded-xl cursor-pointer
               hover:opacity-95 transition-opacity duration-150"
        loading="lazy"
        width={photo.width}
        height={photo.height}
      />
    </div>
  ))}
</div>
```

---

## 6. Animation Techniques

### 6.1 Astro View Transitions (Native, Zero JS Cost)

View Transitions is the most appropriate technology for an Astro photo site. It uses native browser APIs, requires zero additional JavaScript libraries, and gracefully degrades in older browsers.

**Enable globally:**
```astro
<!-- src/layouts/BaseLayout.astro -->
<head>
  <ViewTransitions />
</head>
```

**Hero animation between album card and album page:**
```astro
<!-- Album card (index page) -->
<img
  src={coverUrl}
  alt={title}
  transition:name={`album-cover-${slug}`}
  transition:animate="fade"
/>

<!-- Album header (detail page) -->
<img
  src={coverUrl}
  alt={title}
  transition:name={`album-cover-${slug}`}
/>
```

The browser automatically creates a smooth morph animation between the two elements. No JavaScript needed.

**Custom slide animation for album navigation:**
```css
/* In global CSS */
@keyframes slide-from-right {
  from { transform: translateX(30px); opacity: 0; }
}
@keyframes slide-to-left {
  to { transform: translateX(-30px); opacity: 0; }
}

::view-transition-old(main-content) {
  animation: 300ms ease both slide-to-left;
}
::view-transition-new(main-content) {
  animation: 300ms ease both slide-from-right;
}
```

### 6.2 Framer Motion (Next.js)

For Next.js implementations, Framer Motion provides more expressive control:

**Page transition wrapper:**
```tsx
// components/PageTransition.tsx
import { motion, AnimatePresence } from 'framer-motion';

const variants = {
  hidden:  { opacity: 0, y: 20 },
  enter:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }},
  exit:    { opacity: 0, y: -20, transition: { duration: 0.2 }},
};

export function PageTransition({ children }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div variants={variants} initial="hidden" animate="enter" exit="exit">
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

**Staggered photo grid entrance:**
```tsx
const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  show:   { opacity: 1, scale: 1,    y: 0,
            transition: { duration: 0.3, ease: 'easeOut' } },
};

<motion.div variants={containerVariants} initial="hidden" animate="show">
  {photos.map(photo => (
    <motion.div key={photo.id} variants={itemVariants}>
      <img src={photo.url} />
    </motion.div>
  ))}
</motion.div>
```

**Album card shared element transition (LayoutGroup):**
```tsx
import { LayoutGroup, motion } from 'framer-motion';

// Wrap all cards in LayoutGroup
<LayoutGroup>
  {albums.map(album => (
    <motion.div layoutId={`card-${album.slug}`} key={album.slug}>
      <motion.img layoutId={`img-${album.slug}`} src={album.cover} />
    </motion.div>
  ))}
</LayoutGroup>
```

### 6.3 GSAP ScrollTrigger (Premium Scroll Effects)

For scroll-triggered reveal animations on the album grid:

```javascript
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Staggered card entrance on scroll
gsap.fromTo('.album-card',
  { opacity: 0, y: 40 },
  {
    opacity: 1,
    y: 0,
    duration: 0.6,
    stagger: 0.08,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.album-grid',
      start: 'top 85%',
    }
  }
);
```

**Note:** GSAP's core is free. ScrollTrigger is free. ScrollSmoother (smooth scroll physics) requires a GSAP Club license (~$150/year). For most personal sites, CSS `scroll-behavior: smooth` or the free `Lenis` library is sufficient.

### 6.4 CSS-Only Animations (No Library Required)

```css
/* Fade-up entrance using @starting-style (Chrome 117+) */
.photo-card {
  animation: fade-up 0.4s ease both;
  animation-timeline: view();
  animation-range: entry 0% entry 40%;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

This is a zero-JavaScript scroll reveal using the native **Scroll-Driven Animations API** (Chrome 115+). For broader support, pair with a small IntersectionObserver script.

### 6.5 Lightbox Animation

**Recommended:** `yet-another-react-lightbox` (React) or `Fancybox 5` (vanilla JS / any framework).

Fancybox 5 is used by the Memori template and provides:
- Swipe/drag/pinch-to-zoom on mobile
- Keyboard navigation
- Smooth open/close animation (scale + opacity)
- Thumbnail strip
- Zero dependencies

```javascript
import { Fancybox } from '@fancyapps/ui';
import '@fancyapps/ui/dist/fancybox/fancybox.css';

Fancybox.bind('[data-fancybox="gallery"]', {
  animated: true,
  showClass: 'f-fadeIn',
  hideClass: 'f-fadeOut',
  Toolbar: { display: { left: [], middle: [], right: ['close'] } },
  Images: { zoom: false },
});
```

---

## 7. Curated Open-Source Repositories

### 7.1 Memori — Best All-Around Match

| Property | Value |
|---|---|
| Repo | https://github.com/codewithnemo/memori |
| Stars | Growing (newer project, 2024) |
| Stack | Astro + Tailwind CSS v3 + Svelte + TypeScript |
| Images | Cloudinary (required) |
| Lightbox | Fancybox 5 |
| Animations | Smooth page transitions, light/dark mode |
| Deployment | Vercel, Netlify, GitHub Pages |
| Albums | Markdown frontmatter per gallery folder |
| Unique | Timeline view, location + camera metadata |

**Setup:**
```bash
git clone https://github.com/codewithnemo/memori
cd memori
pnpm install
pnpm new-gallery da-lat-2026   # scaffolds new album
pnpm dev
```

**Album frontmatter:**
```yaml
---
title: "Đà Lạt 2026"
pubDate: 2026-01-20
description: "Fog, flowers, and coffee in the highlands"
location: "Đà Lạt, Lâm Đồng"
camera: "iPhone 16 Pro"
---
```

**Cloudinary:** Upload photos to `galleries/da-lat-2026/` in your Cloudinary account. The template auto-fetches them.

**Verdict:** This is the closest existing open-source template to what you described. The main limitation is that it requires Cloudinary (no local image fallback), and the theme is newer with a smaller community than established options.

---

### 7.2 Charca/astro-photo-gallery — Best for View Transitions

| Property | Value |
|---|---|
| Repo | https://github.com/Charca/astro-photo-gallery |
| Stars | ~200+ |
| Stack | Astro + TypeScript + CSS |
| Images | Unsplash (in demo), easily swapped |
| Animations | Astro View Transitions (hero morph) |
| Lightbox | None (use Fancybox as addon) |
| Deployment | Cloudflare Pages (GitHub Pages compatible) |
| Unique | Original Codrops-inspired grid zoom transitions |

**Notable:** The hero animation — clicking a photo zooms it from grid position to full screen — is the most "iOS Photos" feeling of any open-source web gallery. This is pure View Transitions API, no JavaScript animation libraries.

---

### 7.3 Next.js with-cloudinary — Official Vercel Template

| Property | Value |
|---|---|
| Repo | https://github.com/vercel/next.js/tree/canary/examples/with-cloudinary |
| Stars | Part of Next.js monorepo (200k+ stars) |
| Stack | Next.js 14 + Tailwind + Cloudinary + Framer Motion |
| Images | Cloudinary |
| Animations | Framer Motion modal + blur placeholder |
| Lightbox | Custom headless modal with Headless UI |
| Deployment | Vercel (GitHub Pages needs static export config) |
| Unique | Official, well-maintained, blur placeholders, scroll restoration |

**Blog post / docs:** https://vercel.com/blog/building-a-fast-animated-image-gallery-with-next-js

This template achieved near-perfect Lighthouse scores with 350+ photos. The blur placeholder technique (fetch 50px version, base64 encode, embed in HTML) ensures instant perceived loading.

**Initialize:**
```bash
npx create-next-app@latest --example with-cloudinary my-photo-site
```

---

### 7.4 evadecker/astro-photo-grid — Purest Minimal

| Property | Value |
|---|---|
| Repo | https://github.com/evadecker/astro-photo-grid |
| Demo | https://astro-photo-grid.netlify.app/ |
| Stack | Astro + pure CSS justified grid |
| Images | Local or any CDN |
| Animations | Fancybox lightbox |
| Deployment | Netlify, GitHub Pages |
| Unique | Zero JS for grid layout; auto dark mode; Astro Image component |

Single-page gallery — no album grouping built in, but the grid layout CSS is the cleanest implementation reviewed. Good as a starting base to layer album routing on top of.

---

### 7.5 RaymondWHZ/photo-gallery-astro — Notion CMS + Art Gallery Aesthetic

| Property | Value |
|---|---|
| Repo | https://github.com/RaymondWHZ/photo-gallery-astro |
| Live | https://raymondwhz.art |
| Stack | Astro + Svelte + TailwindCSS + Notion as CMS |
| Images | Notion-hosted or external |
| Animations | Preloaded, optimized |
| Unique | Camera EXIF metadata, aperture/ISO/shutter display; "real-world art gallery" aesthetic |

Uses Notion as a headless CMS for photo metadata — useful if you want to manage metadata without touching code.

---

### 7.6 ECarry/photography-website — Most Feature-Rich

| Property | Value |
|---|---|
| Repo | https://github.com/ECarry/photography-website |
| Stars | 311 |
| Stack | Next.js 16 + React 19 + tRPC + Drizzle ORM + Tailwind + shadcn/ui |
| Images | S3-compatible (R2, AWS S3, MinIO) |
| Maps | Mapbox GL JS (photo location maps) |
| Mobile | PWA features, touch-friendly |
| Unique | EXIF extraction, iPhone album integration, admin dashboard |

Best choice if you want a full-featured app with an admin dashboard, analytics, and location maps. Overkill for a simple static site, but excellent if you want to grow it.

---

### 7.7 Fussel — Static Generator, No Build Framework Required

| Property | Value |
|---|---|
| Repo | https://github.com/cbenning/fussel |
| Stars | ~300 |
| Stack | Python CLI + React (Vite) frontend |
| Images | Local files → generates static HTML |
| Mobile | Pinch/scroll/drag zoom |
| Unique | Drop photos in folders, run one command, done |

Best for non-developers or for a quick local-first gallery. Lacks the polished Apple aesthetic without CSS customization.

---

### 7.8 dougdonohoe/ddphotos — SvelteKit + Go

| Property | Value |
|---|---|
| Repo | https://github.com/dougdonohoe/ddphotos |
| Stack | Go CLI + SvelteKit |
| Images | Local JPEGs → converts to WebP |
| Unique | Go CLI resizes photos, generates JSON indexes; SvelteKit static export |
| HN Discussion | https://news.ycombinator.com/item?id=47322838 |

Interesting architecture for a fully self-contained, zero-cloud-dependency static gallery.

---

## 8. Comparative Analysis

### 8.1 Framework Decision Matrix

| Criterion | Astro | Next.js | Plain HTML |
|---|---|---|---|
| Default JS payload | ~0KB | ~90KB+ | 0KB |
| View Transitions | Native built-in | Via Framer Motion | Via browser API |
| Cloudinary integration | `astro-cloudinary` | `next-cloudinary` | REST API |
| Build complexity | Low | Medium | Very low |
| GitHub Pages deploy | Excellent | Good (needs static export) | Trivial |
| Animation expressiveness | Good (View Transitions) | Excellent (Framer Motion) | Basic |
| Content management | Content Collections | API routes / CMS | Manual |
| Mobile performance | Excellent | Very Good | Excellent |
| Learning curve | Low-Medium | Medium | Low |
| **Verdict** | **Best choice** | Great if you know React | For extreme simplicity |

### 8.2 Image Hosting Decision Matrix

| Service | Free Storage | Free Bandwidth | Transformations | Ease of Use |
|---|---|---|---|---|
| Cloudinary | 25 GB | 25 GB/mo | Yes (f_auto, q_auto, resize) | Excellent SDK |
| Bunny.net Storage | 1 GB free | Pay-per-GB (~$0.01/GB) | No (use imgproxy separately) | Good |
| Backblaze B2 + Cloudflare | 10 GB | Free via CF | No | Moderate |
| Git LFS + GitHub | 1 GB | 1 GB/mo | No | Poor for large files |
| Local (in repo) | Repo size limit | GitHub Pages bandwidth | No | Poor for scale |
| **Verdict** | **Cloudinary free tier** is best for personal sites | | | |

### 8.3 Animation Library Decision Matrix

| Library | Framework | Bundle Size | Capability | Learning Curve |
|---|---|---|---|---|
| CSS View Transitions API | Any | 0KB | Good (morph, fade, slide) | Low |
| Astro ViewTransitions | Astro | ~2KB | Excellent with zero config | Very low |
| Framer Motion | React/Next.js | ~40KB | Excellent (layout, spring, gestures) | Medium |
| GSAP + ScrollTrigger | Any | ~30KB | Excellent (timeline, scroll, SVG) | Medium-High |
| CSS animations only | Any | 0KB | Basic-Good | Low |
| **Verdict for Astro** | Use View Transitions API | | | |
| **Verdict for Next.js** | Use Framer Motion | | | |

---

## 9. Best Practices & Implementation Guide

### 9.1 Album Naming Convention

Use URL-friendly slugs that are also human-readable:
```
da-lat-2026          → "Đà Lạt 2026"
ha-noi-winter-2025   → "Hà Nội Winter 2025"
summer-beach-2025    → "Summer Beach 2025"
wedding-mai-2026     → "Mai & Anh Wedding 2026"
```

Always include the year. It lets you have multiple "Da Lat" albums across years.

### 9.2 Cloudinary Image Organization

```
galleries/
  [album-slug]/
    cover.jpg          ← explicitly named cover
    001-landscape.jpg  ← numbered for consistent ordering
    002-market.jpg
    ...
```

Why number? Cloudinary's `api.resources()` returns images in upload order by default. Pre-numbering gives you control over display order without custom sorting logic.

### 9.3 Responsive Image Sizes

```astro
<CldImage
  src={photo.publicId}
  width={1200}
  height={800}
  sizes="
    (max-width: 640px)  100vw,
    (max-width: 1024px)  50vw,
    (max-width: 1280px)  33vw,
    25vw
  "
  alt={photo.caption}
/>
```

This tells the browser (and Cloudinary) which width to fetch at each breakpoint, preventing mobile phones from downloading desktop-sized images.

### 9.4 LQIP (Low-Quality Image Placeholder) Pattern

```javascript
// Generate blur placeholder at build time
async function getBlurPlaceholder(publicId) {
  const url = cloudinary.url(publicId, {
    transformation: [
      { width: 50, quality: 1, effect: 'blur:100' },
      { fetch_format: 'auto' }
    ]
  });

  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const mimeType = 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}
```

Then in your component:
```html
<img
  src={fullUrl}
  style={`background-image: url(${blurDataUrl}); background-size: cover;`}
  loading="lazy"
/>
```

### 9.5 Photo Count Badge on Album Cards

```astro
---
const photoCount = await getAlbumPhotoCount(album.slug);
---

<span class="text-xs text-gray-400 font-medium tabular-nums">
  {photoCount} photos
</span>
```

### 9.6 Sorting Albums by Date (Most Recent First)

```typescript
const albums = await getCollection('galleries');
const sorted = albums.sort((a, b) =>
  new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
);
```

### 9.7 Keyboard Navigation in Lightbox

When using Fancybox, keyboard navigation (← → arrow keys, Escape) works out of the box. For custom lightboxes, add:

```javascript
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') nextPhoto();
  if (e.key === 'ArrowLeft')  prevPhoto();
  if (e.key === 'Escape')     closeLightbox();
});
```

---

## 10. GitHub Pages Deployment

### 10.1 Astro → GitHub Pages (Official Method)

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Build Astro site
        run: npm run build
        env:
          PUBLIC_CLOUDINARY_CLOUD_NAME: ${{ secrets.CLOUDINARY_CLOUD_NAME }}
          CLOUDINARY_API_KEY: ${{ secrets.CLOUDINARY_API_KEY }}
          CLOUDINARY_API_SECRET: ${{ secrets.CLOUDINARY_API_SECRET }}

      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Astro config for GitHub Pages:**
```javascript
// astro.config.mjs
export default defineConfig({
  site: 'https://yourusername.github.io',
  base: '/your-repo-name',  // only if not using custom domain
  integrations: [tailwind(), cloudinary()],
});
```

### 10.2 Next.js → GitHub Pages

```javascript
// next.config.js
const nextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/repo-name' : '',
  images: { unoptimized: true },  // required for static export
};
```

```yaml
# .github/workflows/deploy.yml
- name: Build Next.js
  run: npm run build
  env:
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: ${{ secrets.CLOUDINARY_CLOUD_NAME }}

- name: Upload artifact
  uses: actions/upload-pages-artifact@v3
  with:
    path: ./out   # Next.js static export output
```

### 10.3 Custom Domain Setup

In your repo: Settings → Pages → Custom domain → `photos.yourname.com`

Create DNS records:
```
CNAME photos.yourname.com yourusername.github.io
```

GitHub automatically provisions a TLS certificate via Let's Encrypt.

---

## 11. Common Challenges & Solutions

### 11.1 Images Not Loading on GitHub Pages

**Problem:** `<img src="/galleries/photo.jpg">` returns 404 on GitHub Pages with `/repo-name` base path.

**Solution:** Use Cloudinary URLs (absolute, not relative) or configure Astro's `base` option:
```astro
import { base } from 'astro:config';
const imgSrc = `${base}/photo.jpg`;
```

### 11.2 Cloudinary API Rate Limits at Build Time

**Problem:** Fetching 500 images × 20 albums = 10,000 API calls per build.

**Solution A:** Cache Cloudinary responses at build time:
```javascript
// scripts/fetch-gallery-data.mjs (run once, commit JSON)
const data = await cloudinary.api.resources({ prefix: 'galleries/', max_results: 2000 });
writeFileSync('src/data/photos.json', JSON.stringify(data));
```

**Solution B:** Use Cloudinary Search API with `expression` to batch-fetch by folder.

**Solution C:** Enable Astro's content layer caching (Astro 5+).

### 11.3 View Transitions Causing Flash of Unstyled Content

**Problem:** First navigation after page load shows a white flash.

**Solution:**
```astro
<!-- Add to BaseLayout.astro -->
<ViewTransitions fallback="swap" />
```
Or set `transition:animate="none"` on elements that should not animate.

### 11.4 Mobile Touch Events Conflicting with Swipe Gestures

**Problem:** Fancybox or custom lightbox swipe conflicts with page scroll.

**Solution:** Fancybox handles this automatically. For custom implementations:
```javascript
// Prevent page scroll while lightbox is open
document.body.style.overflow = isOpen ? 'hidden' : '';
```

### 11.5 Large Number of Photos Slow Build

**Problem:** Astro's `<Image />` component processes all images locally at build time.

**Solution:** Use CldImage from `astro-cloudinary` instead. Cloudinary handles all transformations at delivery time; build time is fast regardless of image count.

### 11.6 Ordering Photos Within Albums

**Problem:** Cloudinary returns images in upload-date order, which may not match intended display order.

**Solutions:**
1. Name files with numeric prefix (`001-`, `002-`) and sort by `public_id`
2. Use Cloudinary metadata `context` field: add `sort_order=1`, `sort_order=2`, etc.
3. Maintain a `photos.yaml` per album with explicit ordering

### 11.7 SEO for Photo Pages

**Problem:** Images behind JavaScript-rendered galleries are not indexed.

**Solution:** Astro pre-renders all album pages to HTML, including `<img>` tags. Add `<meta>` OG tags:
```astro
<meta property="og:image" content={coverUrl} />
<meta property="og:title" content={`${title} — My Photos`} />
```

---

## 12. Community & Ecosystem

### 12.1 Astro Community

- **Discord:** https://astro.build/chat (very active, 30k+ members)
- **Themes:** https://astro.build/themes/ (100+ official themes)
- **Integrations:** https://astro.build/integrations/ (500+ community integrations)
- **GitHub Discussions:** https://github.com/withastro/astro/discussions

### 12.2 Cloudinary Developer Resources

- **Docs:** https://cloudinary.com/documentation
- **Community Forum:** https://community.cloudinary.com/
- **Developer Slack:** Active community with quick responses
- **YouTube:** Cloudinary YouTube channel with weekly tutorials

### 12.3 Key Libraries Used in Photo Gallery Implementations

| Library | Purpose | Source |
|---|---|---|
| `react-photo-album` | Justified rows/columns/masonry layout | https://react-photo-album.com |
| `yet-another-react-lightbox` | Modern React lightbox | https://yet-another-react-lightbox.com |
| `@fancyapps/ui` (Fancybox 5) | Framework-agnostic lightbox | https://fancyapps.com/fancybox/ |
| `photoswipe` | Highly performant lightbox (used by Squarespace) | https://photoswipe.com |
| `framer-motion` | React animation library | https://motion.dev |
| `gsap` + `ScrollTrigger` | Advanced scroll animations | https://gsap.com |
| `lenis` | Smooth scroll (free alternative to ScrollSmoother) | https://lenis.darkroom.engineering |

### 12.4 Design Inspiration Resources

- **Awwwards Gallery:** https://www.awwwards.com/websites/gallery/ — Award-winning photography websites
- **Dribbble Photo Album:** https://dribbble.com/tags/photo_album — UI design mockups
- **Codrops:** https://tympanus.net/codrops — Advanced animation tutorials
- **Godly.website** — Curated gallery of excellent web design

---

## 13. Getting Started Guide

### Option A: Quickest Start (Memori Template, 30 minutes)

**Prerequisites:** Node.js 20+, pnpm, a Cloudinary account (free)

```bash
# 1. Clone the Memori template
git clone https://github.com/codewithnemo/memori my-memories
cd my-memories

# 2. Install dependencies
pnpm install

# 3. Configure Cloudinary
cp .env.example .env.local
# Edit .env.local with your Cloudinary credentials

# 4. Create your first album
pnpm new-gallery da-lat-2026

# 5. Edit the album metadata
# src/content/galleries/da-lat-2026/index.md
# Set title: "Đà Lạt 2026", date, description, location

# 6. Upload photos to Cloudinary
# Use Cloudinary Dashboard or CLI:
# cloudinary uploader upload "*.jpg" folder=galleries/da-lat-2026

# 7. Run dev server
pnpm dev

# 8. Deploy to GitHub Pages
# Push to GitHub, configure Actions secrets (CLOUDINARY_*)
# Enable GitHub Pages in Settings → Pages → GitHub Actions
```

### Option B: Next.js with Cloudinary (Official Vercel Template)

```bash
# 1. Create project from official template
npx create-next-app@latest --example with-cloudinary my-photo-site
cd my-photo-site

# 2. Configure environment variables
echo "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud" >> .env.local
echo "CLOUDINARY_API_KEY=your_key" >> .env.local
echo "CLOUDINARY_API_SECRET=your_secret" >> .env.local
echo "CLOUDINARY_FOLDER=galleries" >> .env.local

# 3. Add static export config for GitHub Pages
# Edit next.config.js: add output: 'export'

# 4. Run locally
npm run dev

# 5. Build and check
npm run build   # generates /out folder
npx serve out   # preview static build

# 6. Deploy
# Push to GitHub, add Actions workflow (see Section 10.2)
```

### Option C: Build From Scratch (Astro + Tailwind + Cloudinary)

**Estimated time: 2-4 hours for a solid foundation**

```bash
# 1. Create Astro project
npm create astro@latest my-memories -- --template minimal
cd my-memories

# 2. Add integrations
npx astro add tailwind
npx astro add cloudinary
npm install @fancyapps/ui

# 3. Create folder structure
mkdir -p src/content/galleries
mkdir -p src/pages/albums
mkdir -p src/components
mkdir -p src/layouts

# 4. Follow the album schema and dynamic routing
# from Section 3.1 of this report

# 5. Deploy to GitHub Pages
# Add .github/workflows/deploy.yml from Section 10.1
```

### Key Files to Create (Custom Build)

```
src/
├── content/
│   ├── config.ts           ← Zod schema for album metadata
│   └── galleries/
│       └── da-lat-2026/
│           └── index.md    ← Album frontmatter
├── layouts/
│   └── BaseLayout.astro    ← With <ViewTransitions />
├── pages/
│   ├── index.astro         ← Album grid (card layout)
│   └── albums/
│       └── [slug].astro    ← Dynamic album page
├── components/
│   ├── AlbumCard.astro     ← Individual card
│   ├── PhotoGrid.astro     ← Masonry grid
│   └── Lightbox.astro      ← Fancybox wrapper
└── styles/
    └── global.css          ← Apple color tokens, animations
```

---

## Appendices

### A. Glossary of Terms

| Term | Definition |
|---|---|
| SSG | Static Site Generator — builds HTML files at build time, not request time |
| Content Collection | Astro's type-safe content management system for local Markdown/YAML files |
| View Transitions API | Native browser API for animated cross-page navigation |
| LQIP | Low-Quality Image Placeholder — tiny blurred version shown while full image loads |
| `f_auto` | Cloudinary transformation: automatically select best format (WebP, AVIF, JPEG) |
| `q_auto` | Cloudinary transformation: automatic quality optimization |
| Lightbox | UI pattern where clicking an image opens it full-screen with navigation |
| Masonry layout | Photo grid where items fill vertical space without gaps (Pinterest-style) |
| Justified grid | Photo grid where all items in a row have the same height (Google Photos-style) |
| `aspect-ratio` | CSS property that locks width-to-height ratio |
| `object-fit: cover` | CSS property that crops image to fill container without distortion |
| SF Pro | Apple's proprietary system font family for iOS/macOS |
| `system-ui` | CSS value that uses the OS's native UI font (SF Pro on Apple, Segoe UI on Windows) |

### B. Additional Resources

**Official Documentation**
- Astro Docs: https://docs.astro.build
- Astro View Transitions: https://docs.astro.build/en/guides/view-transitions/
- Astro GitHub Pages Deploy: https://docs.astro.build/en/guides/deploy/github/
- Astro Cloudinary: https://astro.cloudinary.dev/
- Next Cloudinary: https://next.cloudinary.dev/
- Cloudinary Image Transformations: https://cloudinary.com/documentation/image_transformations
- MDN View Transitions: https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API

**Tutorials**
- Build a photo gallery with Astro (Jan Kraus): https://jankraus.net/2024/04/05/how-to-build-a-simple-photo-gallery-with-astro/
- Build a fast animated gallery with Next.js (Vercel): https://vercel.com/blog/building-a-fast-animated-image-gallery-with-next-js
- List Cloudinary images in Next.js (Space Jelly): https://spacejelly.dev/posts/how-to-list-display-cloudinary-image-resources-in-a-gallery-with-next-js-react
- Astro View Transitions guide: https://eastondev.com/blog/en/posts/dev/20251202-astro-view-transitions-guide/
- Codrops WebGL gallery with GSAP + Astro: https://tympanus.net/codrops/2026/02/02/building-a-scroll-revealed-webgl-gallery-with-gsap-three-js-astro-and-barba-js/

**Design Inspiration**
- Awwwards Gallery Websites: https://www.awwwards.com/websites/gallery/
- Dribbble Photo Album designs: https://dribbble.com/tags/photo_album
- Astro Themes (photography): https://astro.build/themes/

**GitHub Topics to Explore**
- https://github.com/topics/photo-gallery
- https://github.com/topics/photo-album
- https://github.com/topics/photography-portfolio
- https://github.com/topics/web-gallery
- https://github.com/topics/astro-template

### C. References & Citations

1. Memori Template — https://github.com/codewithnemo/memori
2. Astro Photo Gallery (Charca) — https://github.com/Charca/astro-photo-gallery
3. Astro Photo Gallery (jomaendle) — https://github.com/jomaendle/astro-photo-gallery
4. Astro Photo Gallery (RaymondWHZ) — https://github.com/RaymondWHZ/photo-gallery-astro
5. Astro Photo Grid (evadecker) — https://github.com/evadecker/astro-photo-grid
6. Next.js with-cloudinary example — https://github.com/vercel/next.js/tree/canary/examples/with-cloudinary
7. next-cloudinary community library — https://github.com/cloudinary-community/next-cloudinary
8. ECarry photography website — https://github.com/ECarry/photography-website
9. Fussel static gallery generator — https://github.com/cbenning/fussel
10. DD Photos (SvelteKit+Go) — https://github.com/dougdonohoe/ddphotos
11. react-photo-album — https://github.com/igordanchenko/react-photo-album
12. Vercel Image Gallery Template — https://vercel.com/templates/next.js/image-gallery-starter
13. Vercel "Building a fast animated image gallery" — https://vercel.com/blog/building-a-fast-animated-image-gallery-with-next-js
14. Astro View Transitions Docs — https://docs.astro.build/en/guides/view-transitions/
15. Astro Cloudinary Docs — https://astro.cloudinary.dev/
16. Next Cloudinary Docs — https://next.cloudinary.dev/
17. MDN View Transition API — https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
18. Cloudinary Image Gallery Guide — https://cloudinary.com/guides/image-effects/creating-an-interactive-photo-gallery-using-javascript
19. Space Jelly Cloudinary Tutorial — https://spacejelly.dev/posts/how-to-list-display-cloudinary-image-resources-in-a-gallery-with-next-js-react
20. Astro Photo Gallery Tutorial (Jan Kraus) — https://jankraus.net/2024/04/05/how-to-build-a-simple-photo-gallery-with-astro/
21. Apple Developer Fonts Page — https://developer.apple.com/fonts/
22. Codrops GSAP+Astro WebGL Gallery — https://tympanus.net/codrops/2026/02/02/building-a-scroll-revealed-webgl-gallery-with-gsap-three-js-astro-and-barba-js/
23. Fancybox 5 — https://fancyapps.com/fancybox/
24. GSAP ScrollTrigger — https://gsap.com/scroll/
25. CSS Masonry Layout (MDN) — https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Masonry_layout
26. Cloudinary Responsive Image Gallery — https://cloudinary.com/guides/responsive-images/responsive-image-gallery
27. GitHub photo-gallery topic — https://github.com/topics/photo-gallery
28. GitHub photography-portfolio topic — https://github.com/topics/photography-portfolio

---

## Conclusion

### The Recommended Stack for Your Use Case

For a Vietnamese travel memory site (albums like "Đà Lạt 2026", "Hà Nội Winter") that is mobile-first, elegant, Apple-inspired, and deploys to GitHub Pages, the optimal stack is:

**Framework:** Astro 5
**Styling:** Tailwind CSS 4
**Images:** Cloudinary (free tier, via `astro-cloudinary`)
**Animations:** Astro View Transitions API (native, zero-JS)
**Lightbox:** Fancybox 5
**Deployment:** GitHub Pages via GitHub Actions
**Font:** `system-ui` / Inter

**Starting template:** Fork `codewithnemo/memori` — it implements all of the above already.

### What to Customize on Top of Memori

1. **Typography:** Swap to Inter from Google Fonts for cross-platform consistency
2. **Color palette:** Add your Apple-style CSS variables (Section 5.2)
3. **Hero animation:** Add `transition:name` to album cover images for iOS-style morph transitions
4. **Album metadata:** Add `tags` field for filtering (e.g., "Vietnam", "Mountains", "Food")
5. **Scroll animations:** Add CSS Scroll-Driven Animations for photo entrance effects (zero JS)
6. **Open Graph:** Add `<meta>` tags per album for social sharing

### What Makes It Feel Like a Native App

The combination of four things creates the native-app illusion on the web:
1. **View Transitions API** — pages don't flash white; elements morph between routes
2. **`system-ui` font** — text renders with the OS's native typeface
3. **18px border-radius on cards** — matches iOS card radius exactly
4. **Spring-physics hover animations** — `cubic-bezier(0.25, 0.1, 0.25, 1)` matches UIKit easing

None of these require heavy JavaScript. The lightest implementation — pure Astro with View Transitions and Tailwind — ships essentially no runtime JavaScript while achieving the same visual feel as a native iOS app.

---

_Research conducted on 2026-03-30 | Sources: 28 authoritative references | Frameworks covered: Astro, Next.js, plain HTML | Repositories reviewed: 15+ open-source projects_
