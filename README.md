# Anubhav (अनुभव) — Web

> **Live it. Share it. — Create more. Share less.**

A calm, distraction-free web application for sharing real experiences, craft, and meaningful updates. Faithful web recreation of the native Anubhav Android application, connecting to the shared Supabase backend.

---

## Philosophy & Core Principles

- **No Vanity Metrics**: Strict like privacy. Only the post creator can view the number of likes on their own posts (`♡ 12 likes`). For everyone else, likes are purely a quiet gesture (`♡` or `♥`) without counts.
- **No Engagement Traps**: Chronological feed only. No follower counts, no algorithmic ranking, no ads, no read receipts, and no public leaderboards.
- **Calm Minimalist UI**: Designed with intentional breathing room, muted earthen tones, and seamless light/dark mode transitions matching the native Android experience.

---

## Features

- **Chronological Feed**: Paginated feed showing genuine thoughts, craft, and updates from creators.
- **Thoughtful Composer**: Create text or photo updates with client-side image compression (< 1MB) matching the Android app behavior.
- **Creator Profiles**: Clean showcase featuring *"Currently working on"* and *"Things I've done"* portfolios.
- **Authentication**: Email/password and username login, user registration, and password recovery via Supabase Auth.
- **Community Safety & Moderation**: In-app reporting flow and dedicated admin moderation suite (review reports, user penalties, post removals, audit logging).
- **Responsive Experience**: Optimized 3-column desktop layout with left sidebar navigation and right contextual panel, transforming gracefully into the native mobile bottom-bar navigation on smaller screens.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React
- **Backend / Database**: Supabase (PostgreSQL, Row-Level Security, Database Functions / RPC, Storage)
- **Code Quality**: Oxlint, TypeScript strict mode

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/shailesh-pande01/Anubhav-web.git
cd Anubhav-web
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure your Supabase URL and anon key in `.env`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Build for Production

```bash
npm run build
npm run preview
```
