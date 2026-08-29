# 🚀 ComputerJy World — Modern Headless Astro Frontend & WordPress Theme

A modern, high-performance, tech-savvy, and energetic theme suite built for **[ComputerJy World](https://www.computerjy.com/)** based on the updated brand identity guidelines.

---

## 🎨 Brand Identity Specifications

- **Brand Voice**: Friendly, Tech-savvy, Energetic, Insightful.
- **Typography**:
  - **Headings**: `Plus Jakarta Sans` (weights: 600, 700, 800, 900)
  - **Body**: `Inter` (weights: 400, 500, 600, 700)
  - **Monospace / Code**: `JetBrains Mono`
- **Color Palette & Gradients**:
  - **Primary Gradient**: `linear-gradient(135deg, #00D2FF 0%, #0080FF 45%, #7209B7 100%)` *(Electric Cyan &rarr; Royal Blue &rarr; Cyber Purple)*
  - **Energy Accent Gradient**: `linear-gradient(135deg, #FF006E 0%, #FB5607 50%, #FFD166 100%)` *(Vibrant Coral &rarr; Tangerine &rarr; Golden Amber)*
  - **Dark Base / Surface**: `#0B0F19` / `#111827` (Deep Midnight Slate)
  - **Light Base / Surface**: `#F8FAFC` / `#FFFFFF` (Crisp Clean Modern Slate)
- **Visual Style**:
  - Pixelated mascot icon & play button badge (`logo-icon.svg`)
  - Golden star sparkles (`✦`)
  - Subtle circuit board background patterns
  - Bento grid cards with smooth hover lift & glowing border accents
  - Glassmorphic sticky header (`backdrop-filter: blur(16px)`)

---

## ⚡ 1. Modern Headless Frontend (Astro 7 + Tailwind)

The primary frontend is built with **Astro 7** and **Tailwind CSS**, fetching all content from
the live **WordPress REST API** (`https://www.computerjy.com/wp-json/wp/v2/`) at build time via
the Astro Content Layer (`src/content.config.ts`, `src/lib/wp-loader.ts`).

There is no bundled content snapshot and no offline fallback: if the API is unreachable the
build fails rather than shipping stale content. Publishing in WordPress therefore requires a
rebuild for changes to appear on the static site.

### Project Structure

```text
src/
├── content.config.ts             # Astro Content Layer collections (posts, categories, tags)
├── components/
│   ├── AuthorCard.astro          # Eyad Salah bio & social widget
│   ├── BentoShowcase.astro       # Hero featured article + 3 side cards
│   ├── Footer.astro              # Multi-column footer & back-to-top
│   ├── Header.astro              # Glass navbar with dark/light switcher & search
│   ├── HeroBanner.astro          # Site stats (500+ Articles, 18+ Years Online)
│   ├── PostCard.astro            # Responsive post card with category badges
│   ├── ReadingProgressBar.astro  # Fixed top scroll progress indicator
│   ├── SearchModal.astro         # ⌘K interactive search overlay
│   ├── Sidebar.astro             # Author, trending ranks, categories & tags
│   └── SocialShare.astro         # Social share buttons & 1-click link copy
├── layouts/
│   └── BaseLayout.astro          # ViewTransitions router & zero-FOUC script
├── lib/
│   ├── api.ts                    # WP REST API client with in-memory caching
│   ├── wp-client.ts              # WordPress REST API HTTP client
│   ├── wp-loader.ts              # Content Layer loader that fetches WP data at build time
│   ├── normalize.ts              # Normalizes raw WP API responses into content schema
│   └── types.ts                  # TypeScript definitions
├── pages/
│   ├── 404.astro                 # Custom 404 error page
│   ├── category/[slug].astro     # Dynamic category archives
│   ├── index.astro               # Homepage bento feed
│   ├── posts/[slug].astro        # Single article view with reading suite
│   ├── privacy-policy.astro      # Static pages
│   └── tag/[slug].astro          # Dynamic tag archives
└── styles/
    └── global.css                # Tailwind @theme tokens & circuit background
```

### Running Locally

```bash
# Start local development server
npm run dev

# Build static site to dist/
npm run build

# Preview production build locally
npm run preview
```

### Deployment

The static output directory (`dist/`) is universal and deploys directly to:
- **Cloudflare Pages** (Build command: `npm run build`, Output directory: `dist`)
- **Vercel** (Framework preset: `Astro`, Output directory: `dist`)
- **Netlify** (Build command: `npm run build`, Publish directory: `dist`)
- **GitHub Pages / Traditional Web Servers** (Nginx, Apache, Caddy)

---

## 📦 2. Traditional WordPress Theme (PHP)

The project also includes a complete classic WordPress PHP theme in the root directory:

- [`style.css`](style.css): Theme metadata header
- [`functions.php`](functions.php): Theme setup, menus, sidebars, reading time, customizer
- [`header.php`](header.php) & [`footer.php`](footer.php): Glass navbar and footer
- [`index.php`](index.php), [`single.php`](single.php), [`page.php`](page.php), [`archive.php`](archive.php), [`search.php`](search.php), [`404.php`](404.php)
- [`assets/css/theme.css`](assets/css/theme.css) & [`assets/js/theme.js`](assets/js/theme.js)
- [`screenshot.png`](screenshot.png): WordPress theme preview screenshot

### To Install on WordPress:
```bash
zip -r computerjy-theme.zip 404.php archive.php comments.php footer.php functions.php header.php index.php page.php search.php sidebar.php single.php style.css screenshot.png template-parts/ assets/
```
Upload `computerjy-theme.zip` in **WordPress Admin &rarr; Appearance &rarr; Themes &rarr; Add New &rarr; Upload Theme**.
