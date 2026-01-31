# Copilot Instructions for gym-rat-ai

## Project Overview
**gym-rat-ai** is a full-stack fitness tracking and nutrition planning application with a Next.js frontend and FastAPI backend. The project enables users to track workouts (lifting records), calculate personalized nutrition macros, and interact via blog/community features with Supabase authentication.

### Architecture
- **Frontend** (`/frontend`): Next.js 16 with TypeScript, TailwindCSS, Three.js for 3D visualization, Recharts for data visualization
- **Backend** (`/backend`): FastAPI with JSON-based persistence (local `database.json`)
- **Database**: Supabase (PostgreSQL) for user auth, profiles, blog posts, comments, update logs
- **Auth**: Supabase SSR with OAuth callback handling

## Key Data Flows

### 1. User Profile & Persistence
- Users authenticate via Supabase auth (callback in [auth/callback/route.ts](auth/callback/route.ts))
- Profile data stored in Supabase `profiles` table (gender, height, weight, age, lift stats, nutrition preferences)
- Local fallback: `localStorage` key `"gymRatData"` stores form state + settings
- **Critical**: Always check `session?.user?.id` before querying/updating profile data; handle both authenticated and anonymous users

### 2. Macro Calculation Pipeline
Main logic in [page.tsx](app/page.tsx) lines 27-46:
1. Load BMR using Harris-Benedict formula with weight, height, age, gender
2. Apply **split factor** (1.2-1.6 based on training frequency) + **activity factor** (-0.1 to 0.4)
3. Apply **goal factor** (bulk: +400, cut: -500, diet: -300, lean: +200 kcal)
4. Calculate macros: protein first (weight × `protMult`), then fat/carb split by `carbRatio`
5. Return `result` object with `kcal`, `macros_chart` array, and `routine` recommendations

### 3. Blog & Community (Supabase Tables)
- **posts** table: title, body, category, difficulty, is_deleted, is_pinned, user_id
- **comments** table: post_id, user_id, body, is_deleted, soft-delete pattern
- **comment_likes** & **post_likes**: one-to-many relationships
- **Admin role** check: `profiles.role === "admin"` determines delete/restore/pin permissions
- Soft-delete pattern: flag `is_deleted = true` instead of hard-delete; admins can restore

### 4. Update Logs (Sidebar Widget)
- Supabase `update_logs` table: title, desc, font_size, created_at
- Read-only for non-admins; admins can create/edit/delete via [Sidebar.tsx](app/components/Sidebar.tsx) form
- **Validation**: font_size constrained 1-30 with default 11; use `toFontSize()` helper

## Project Conventions

### Component Patterns
1. **"use client" directive**: All interactive components start with `"use client"` (e.g., [page.tsx](app/page.tsx), [CommentSection.tsx](app/components/CommentSection.tsx))
2. **State management**: React hooks (useState, useEffect, useCallback); NO Redux/Context
3. **Icons**: Use react-icons (FaXxx from "react-icons/fa") exclusively
4. **Async data**: Always include `loading` state and error console.log

### Styling & UI
- **Framework**: TailwindCSS v4 with PostCSS
- **Dark mode default**: Most components hardcode dark backgrounds (bg-zinc-950, text-white)
- **Charts**: Recharts (PieChart, ResponsiveContainer) for nutrition visualization; see [page.tsx](app/page.tsx) macros_chart rendering
- **Responsiveness**: Use `flex` layouts; mobile sidebar toggle with `isMobileOpen` state

### Backend (FastAPI)
- **Models**: Define with Pydantic BaseModel (Record, UserInput, etc.) in [main.py](../backend/main.py)
- **Database**: Simple JSON persistence; load/save helpers at top of file
- **Calculations**: Epley formula for estimated 1RM: `weight × (1 + reps / 30)`
- **Volume**: `weight × reps × sets`
- **CORS**: Enabled for all origins (`allow_origins=["*"]`)

### Naming Conventions
- Files: kebab-case for routes (page.tsx, route.ts), PascalCase for components
- Variables: camelCase for JS/TS, snake_case in SQL/Python (weight, prot_mult, etc.)
- Boolean prefixes: is_* (is_deleted, is_admin), show* (showUpdates, showAddForm)

## Critical Integration Points

### Supabase Client Usage
- Browser: `supabase` from [lib/supabase.ts](lib/supabase.ts) — uses createBrowserClient
- Auth session: Always check with `supabase.auth.getSession()` or `getUser()` before mutations
- Query pattern: `.from("table").select("...").eq("id", id).single()` for single row; add `.order()` for lists

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Backend runs on hardcoded `http://localhost:8000` in development

### Form Input Handling
- Controlled components: `useState` + `onChange` + `value`
- Numeric inputs: Coerce with `Number()` before calculations
- Date strings: ISO format (YYYY-MM-DD) for database, format with custom helpers in components

## Development Workflows

### Running the Project
```bash
# Frontend (Next.js dev server, http://localhost:3000)
cd frontend && npm run dev

# Backend (FastAPI, http://localhost:8000)
cd backend && python main.py
# or: uvicorn main:app --reload
```

### Build & Deployment
- Frontend: `npm run build` → Next.js static/SSR build
- Backend: Single main.py file; deploy as Docker container with `uvicorn main:app`

### Debugging Tips
- Browser DevTools: Check localStorage["gymRatData"] for form state persistence
- Supabase dashboard: Inspect auth, profiles, posts tables directly
- Backend: Print to console; check database.json for lifting records
- Auth issues: Verify NEXT_PUBLIC_* env vars are set; check Supabase project settings

## Common Patterns to Avoid / Watch Out For

1. **Direct database.json edits** in production; always use API endpoints
2. **Missing "use client"** in interactive components (will cause SSR hydration errors)
3. **Hardcoded URLs**; use environment variables for API endpoints
4. **Forgetting error.console.log()** in async operations; always log for debugging
5. **Unit mismatch**: Form inputs are metric (kg, cm) or imperial (lbs, in) — check `unit` state before calculations
6. **Role checks**: Always verify `user?.id` AND profile role before allowing admin operations; don't rely on frontend-only checks
