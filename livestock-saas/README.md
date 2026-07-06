# SmartHerd — Livestock Management SaaS

A professional, multi-tenant SaaS platform for livestock management built with Next.js 14.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Flow

```
/ (Landing Page)
  → /features
  → /pricing
  → /about
  → /contact
  → /login  →  /dashboard (and all sub-pages)
```

## Project Structure

```
src/
├── app/
│   ├── (marketing)/          ← Public landing website
│   │   ├── layout.tsx        ← Navbar + Footer wrapper
│   │   ├── page.tsx          ← Home / Landing
│   │   ├── features/
│   │   ├── pricing/
│   │   ├── about/
│   │   └── contact/
│   ├── (auth)/               ← Auth pages (no sidebar)
│   │   ├── layout.tsx
│   │   └── login/
│   ├── (dashboard)/          ← App (sidebar + topnav)
│   │   ├── layout.tsx
│   │   ├── dashboard/        ← Main dashboard
│   │   ├── animals/
│   │   │   └── [id]/         ← Animal profile
│   │   ├── milk/
│   │   ├── reproduction/
│   │   ├── health/
│   │   ├── nutrition/
│   │   ├── analytics/
│   │   ├── notifications/
│   │   └── settings/
│   ├── globals.css
│   └── layout.tsx            ← Root layout (AuthProvider only)
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── TopNav.tsx
│   └── marketing/
│       ├── Navbar.tsx
│       ├── Footer.tsx
│       ├── HeroSection.tsx
│       ├── FeaturesSection.tsx
│       ├── PricingSection.tsx
│       ├── TestimonialsSection.tsx
│       └── CTASection.tsx
├── contexts/
│   └── AuthContext.tsx        ← Mock auth (ready for backend)
├── hooks/
│   └── useAuth.ts
├── services/
│   └── api.ts                 ← API layer (mock → real swap)
├── data/
│   └── mockData.ts            ← All mock data with farmId
├── types/
│   └── index.ts               ← All TypeScript types
├── constants/
│   └── index.ts               ← Routes, nav, pricing, features
└── lib/
    └── utils.ts               ← cn(), formatDate(), helpers
```

## Multi-Tenant Architecture

Every data record includes a `farmId` field. When the backend is ready:
- Replace mock functions in `src/services/api.ts` with real `fetch()` calls
- Add `Authorization: Bearer <token>` headers
- Backend filters all queries by `farmId` from the JWT claim

## Connecting to Backend

All API calls are in `src/services/api.ts`. Each function has a commented-out real implementation ready to uncomment:

```ts
// REAL IMPLEMENTATION (uncomment when backend is ready):
// const res = await fetch(`${API_BASE}/animals`, { headers: { Authorization: `Bearer ${token}` } });
```

Set `NEXT_PUBLIC_API_URL` in `.env.local` when your backend is ready.
