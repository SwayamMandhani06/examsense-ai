# ExamSense AI – Frontend

Production-grade Next.js 14 frontend for the ExamSense AI academic intelligence platform.

## Tech Stack

- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS** (dark design system)
- **Zustand** (auth + subject state)
- **TanStack React Query** (data fetching, caching)
- **Axios** (HTTP client with JWT interceptors)
- **Recharts** (analytics charts)
- **Framer Motion** (page transitions, animations)
- **Lucide React** (icons)
- **react-hot-toast** (notifications)

## Getting Started

```bash
# Install dependencies
npm install

# Run development server (ensure FastAPI backend is running on :8000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Landing page (/)
│   ├── providers.tsx       # React Query + Toast providers
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   └── page.tsx        # Stats + charts overview
│   ├── subjects/
│   │   ├── page.tsx        # Subject listing grouped by year
│   │   └── [subjectId]/
│   │       └── page.tsx    # Subject detail with tabs
│   ├── analytics/
│   │   └── page.tsx        # Full analytics dashboard
│   └── ask-ai/
│       └── page.tsx        # RAG chat interface
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx     # Collapsible sidebar with Framer Motion
│   │   ├── Navbar.tsx      # Sticky top navbar
│   │   └── DashboardLayout.tsx
│   ├── ui/
│   │   ├── Card.tsx
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   └── StatCard.tsx
│   ├── charts/
│   │   ├── DifficultyTrendChart.tsx  # Recharts line chart
│   │   ├── TopicDistributionChart.tsx # Bar chart
│   │   ├── UnitDistributionChart.tsx  # Bar chart
│   │   └── DifficultyDistributionChart.tsx # Pie chart
│   └── ai/
│       ├── ChatWindow.tsx       # Full chat interface
│       ├── MessageBubble.tsx    # User/AI message rendering
│       └── SourceReferences.tsx # Expandable source tags
│
├── lib/
│   ├── axios.ts     # Configured axios + JWT interceptors
│   ├── api.ts       # All API wrapper functions
│   ├── auth.ts      # Auth helpers (localStorage)
│   ├── constants.ts # Colors, routes, config
│   └── utils.ts     # cn(), formatters
│
├── store/
│   ├── authStore.ts    # Zustand auth (persisted)
│   └── subjectStore.ts # Zustand subject state
│
├── types/
│   ├── user.ts
│   ├── subject.ts
│   ├── analytics.ts
│   └── material.ts
│
└── styles/
    └── globals.css   # Tailwind base + custom animations
```

## Backend Integration

The frontend expects a FastAPI backend at `http://localhost:8000` (configurable via `NEXT_PUBLIC_API_URL`).

### Required endpoints:
- `POST /auth/login` → `{ user, accessToken, tokenType }`
- `POST /auth/register`
- `GET /subjects`
- `GET /subjects/:id`
- `GET /analytics/difficulty-trend?subject_id=`
- `GET /analytics/topic-distribution?subject_id=`
- `GET /analytics/unit-distribution?subject_id=`
- `GET /analytics/difficulty-distribution?subject_id=`
- `GET /analytics/repeated-questions?subject_id=`
- `POST /ask` → `{ answer, sources, sessionId }`

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Design System

| Token | Value |
|---|---|
| `--bg` | `#0F1117` |
| `--card` | `#161A23` |
| `--surface` | `#1B2030` |
| `--border` | `#2A2F3A` |
| `--primary` | `#7C3AED` |
| `--text` | `#E6E8EC` |
| `--muted` | `#9CA3AF` |

Typography: **Syne** (display/headings) + **DM Sans** (body)
