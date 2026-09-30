# Scrumfort CMS Client — Project Documentation

This document explains **what every folder does, what code lives in it, why it's written that way, and how it all works together.** It assumes no prior Next.js knowledge.

Stack: **Next.js 16.2.10** (App Router) + **React 19** + **Redux Toolkit / RTK Query** + **Tailwind CSS v4** + **base-ui / shadcn** components.

> ⚠️ Note on Next.js 16: this project uses `proxy.ts` at the project root, not `middleware.ts`. In Next.js 16 the "Middleware" feature was renamed to "Proxy" — same functionality, new name and file. If you've used older Next.js tutorials, mentally swap "middleware" → "proxy".

---

## 1. The big picture — how a request flows through this app

Before diving folder-by-folder, here's the mental model:

1. Browser requests a URL, e.g. `/dashboard/blogs`.
2. **`proxy.ts`** runs first (on the server, before any page renders). It checks for an `accessToken` cookie and redirects to `/login` if the route is protected and there's no token.
3. Next.js's **App Router** (the `app/` folder) matches the URL to a `page.tsx` file, wrapping it in any `layout.tsx` files above it in the folder tree.
4. The root **`app/layout.tsx`** renders `<Providers>` (from `providers/index.tsx`), which sets up Redux and Auth context for the whole app.
5. The page component calls a **Redux Toolkit Query hook** (e.g. `useGetBlogsQuery`) from `redux/api/`, which fires an HTTP request to the backend, using `lib/cookies.ts` to attach the auth token.
6. Data comes back, the **component** (in `components/`) renders it.
7. If it's an auth-sensitive page, **`context/AuthContext.tsx`** tracks who's logged in and exposes `login`/`logout`/`user` to any component via the `useAuth()` hook.

Everything below expands on each piece of that flow.

---

## 2. `app/` — pages and routing (Next.js App Router)

Next.js uses **file-based routing**: the folder structure under `app/` *is* your URL structure. No router library, no route config file — you create a folder, and that folder becomes a URL segment.

### Key file conventions
- **`page.tsx`** — makes a route segment publicly visible/navigable. If a folder has no `page.tsx`, it's not a route by itself (just an organizational folder).
- **`layout.tsx`** — wraps every `page.tsx` inside its folder (and subfolders) with shared UI (nav bars, providers, etc.). Layouts **persist** across navigations between pages that share them — they don't re-render on every page change.
- **`globals.css`** — global stylesheet, imported once in the root layout.

### Route groups: `(authLayout)` and `(dashboardLayout)`
Folders wrapped in parentheses, like `app/(authLayout)/` and `app/(dashboardLayout)/`, are **route groups**. The parentheses tell Next.js: *"organize files here, but don't add this folder name to the URL."*

That's why:
- `app/(authLayout)/login/page.tsx` → the actual URL is `/login`, **not** `/authLayout/login`.
- `app/(dashboardLayout)/dashboard/blogs/page.tsx` → URL is `/dashboard/blogs`.

This project uses two route groups to give two totally different page layouts without affecting URLs:

| Route group | Layout file | Purpose |
|---|---|---|
| `(authLayout)` | centers content on a plain background | login / forgot-password screens |
| `(dashboardLayout)` | renders `<Sidebar>` + `<Topbar>` around the page | the actual CMS admin screens |

```
app/
├── layout.tsx                        ← root layout (wraps EVERYTHING)
├── page.tsx                          ← "/" → redirects to /login
├── (authLayout)/
│   ├── layout.tsx                    ← centered card layout
│   ├── login/page.tsx                ← "/login"
│   └── forgot-password/page.tsx      ← "/forgot-password"
└── (dashboardLayout)/
    ├── layout.tsx                    ← sidebar + topbar layout
    └── dashboard/
        ├── page.tsx                  ← "/dashboard" → redirects to /dashboard/blogs
        ├── blogs/page.tsx            ← "/dashboard/blogs"
        └── newsletter/page.tsx       ← "/dashboard/newsletter"
```

### Server vs. Client components
By default, every component in `app/` is a **Server Component** — it renders on the server and ships zero JavaScript to the browser for that component. Any file that needs interactivity (state, click handlers, browser APIs) must opt in with `"use client"` at the top of the file. You'll see this on `login/page.tsx`, `AuthContext.tsx`, `providers/index.tsx`, etc. — anything using `useState`, `useEffect`, or event handlers.

`redirect(...)` (used in `app/page.tsx` and `dashboard/page.tsx`) is a Next.js server function that throws a special signal to redirect **before** anything renders — that's why those pages can be plain server components with no `"use client"`.

### `proxy.ts` (project root, next to `app/`)
This is Next 16's renamed `middleware.ts`. It runs on **every** matching request, before rendering:

```ts
export function proxy(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;
  if (isProtectedRoute && !token) redirect to /login
  if (isLoginRoute && token) redirect to /dashboard/blogs
}
```

This is the **route guard**: it stops unauthenticated users from ever reaching `/dashboard/*`, and stops already-logged-in users from seeing the login page again. The `config.matcher` at the bottom tells Next.js which paths to even run this on (everything except static assets).

Why both this *and* `AuthContext`? This is a fast, cookie-only check (no API call) that runs at the edge before a page even starts rendering — good for blocking navigation early. `AuthContext` (below) is the richer, client-side source of truth (actual user object, profile data) used *within* pages.

---

## 3. `redux/` — server state via Redux Toolkit Query (RTK Query)

### Why Redux/RTK Query here?
This app talks to a backend API constantly (blogs, newsletter subscribers, auth). Instead of hand-writing `fetch` + `useState` + `useEffect` for every list/detail/create/update/delete, **RTK Query** generates React hooks that handle:
- fetching
- loading/error states
- caching (so navigating back to a page doesn't always re-fetch)
- automatic cache invalidation ("I just created a blog, refresh the blog list")

You will *not* find hand-written reducers/actions here (the classic old-school Redux pattern) — this project only uses RTK Query, which is Redux Toolkit's data-fetching layer built on top of the same store.

### `redux/store.ts`
```ts
export const store = configureStore({
  reducer: { [baseApi.reducerPath]: baseApi.reducer },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
});
```
This is the single Redux store for the whole app. Notice there's only **one** slice registered: `baseApi.reducer`. Every API feature (blogs, auth, newsletter) plugs itself into this same `baseApi` (see below) rather than each having its own store slice — that's an RTK Query pattern called **"one API, injected endpoints."**

### `redux/hooks.ts`
```ts
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```
Thin, typed wrappers around plain `react-redux` hooks. You'd use `useAppSelector` instead of `useSelector` so TypeScript knows the shape of your store automatically. In practice, this project barely reads from the store directly (RTK Query hooks handle that internally) — these exist for any future manual state needs.

### `redux/api/baseApi.ts` — the foundation
```ts
export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = getAccessToken();          // from lib/cookies.ts
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Blog", "Newsletter"],
  endpoints: () => ({}),
});
```
This is the **empty shell**. `createApi` from RTK Query builds an object with zero endpoints, but with the shared config every request needs:
- **`baseUrl`** — the backend's root URL (from an env var).
- **`prepareHeaders`** — runs before every request; reads the JWT out of the cookie (via `lib/cookies.ts`) and attaches it as `Authorization: Bearer <token>`. This is *why you never see manual header-setting in the feature files* — it's centralized here.
- **`tagTypes`** — declares the categories of cache tags this API can use (explained under "cache invalidation" below).

Feature files then call `baseApi.injectEndpoints({...})` to **add** their endpoints onto this shared object, instead of creating separate `createApi` instances. This keeps one shared cache and one middleware registration.

### `redux/api/types.ts` — shared API shapes
```ts
export interface ApiEnvelope<T> { success, statusCode, message, meta?, data: T }
export interface PaginationMeta { page, limit, total, totalPage, hasNextPage, hasPrevPage }
export interface PaginationParams { page, limit }
export interface PaginatedResult<T> { items: T[]; meta: PaginationMeta }
```
The backend wraps **every** response in an envelope: `{ success, statusCode, message, data, meta? }`. Rather than repeating that unwrapping logic in every component, each endpoint's `transformResponse` (see below) strips the envelope down to just the `data` (and `meta` for lists), so components only ever deal with `Blog[]`, `Subscriber`, etc. — never the envelope.

### `redux/api/authApi.ts`
```ts
login: builder.mutation<LoginResponse, LoginRequest>({ ... })
getMyProfile: builder.query<AuthUser, void>({ ... })
```
- A **`mutation`** = an endpoint that changes server state (POST/PATCH/DELETE) — `login` here.
- A **`query`** = an endpoint that reads data (GET) — `getMyProfile` here.
- Exports `useLoginMutation` and `useLazyGetMyProfileQuery` — the `Lazy` prefix means the query does **not** auto-fire on mount; you call it manually (used in `AuthContext` to check the session once on load).

### `redux/api/blogApi.ts` and `redux/api/newsletterApi.ts`
Same pattern repeated for each domain: `getX` (list, paginated), `getX` by id, `createX`, `updateX`, `deleteX`. Two RTK Query features worth calling out since they're not obvious to a beginner:

**Cache invalidation via tags** — e.g. in `blogApi.ts`:
```ts
providesTags: (result) => result
  ? [...result.items.map(({ id }) => ({ type: "Blog", id })), { type: "Blog", id: "LIST" }]
  : [{ type: "Blog", id: "LIST" }],
```
This tells RTK Query "the blog list query's cached data is described by these tags." Then `createBlog`/`updateBlog`/`deleteBlog` declare:
```ts
invalidatesTags: [{ type: "Blog", id: "LIST" }],
```
When a mutation fires, RTK Query invalidates any cached query with a matching tag and **automatically refetches it** — that's the entire mechanism behind "create a blog → the list updates itself" with no manual `refetch()` calls anywhere in the components.

**FormData for file uploads** — `blogApi.ts`'s `toBlogFormData()` builds a `multipart/form-data` body (JSON fields stringified into one `bodyData` field, images appended as files) because blog creation/update needs to upload images alongside JSON data — a plain JSON body can't carry files.

### How a component actually uses this
```tsx
const { data, isLoading } = useGetBlogsQuery({ page, limit, search, status, visibility });
```
That's it. RTK Query auto-generates this hook from the `getBlogs` endpoint definition. No `useEffect`, no manual loading state — `injectEndpoints` + `createApi` generated it all.

---

## 4. `providers/index.tsx` — wiring up app-wide context

```tsx
"use client";
export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>          {/* react-redux: makes the Redux store available everywhere */}
      <AuthProvider>                  {/* our own auth context, see below */}
        {children}
        <Toaster />                   {/* sonner: renders toast notifications anywhere */}
      </AuthProvider>
    </Provider>
  );
}
```
**Why a separate `providers/` folder instead of putting this in `app/layout.tsx` directly?** The root layout (`app/layout.tsx`) is a **Server Component** by default, but `<Provider store={store}>` needs to run in the browser (Redux, Context, and Sonner all need client-side JavaScript). Rather than marking the *entire* root layout `"use client"` (which would lose server-rendering benefits for the whole app), the client-only bits are isolated into this one small `"use client"` component, and the root layout just renders `<Providers>{children}</Providers>` around everything. This is the standard Next.js App Router pattern for "I need a client-side provider at the top of my app."

---

## 5. `context/AuthContext.tsx` — authentication state (React Context API)

React Context is the built-in way to share a value (state + functions) across many components **without** passing props down manually through every level ("prop drilling"). Redux could do this too, but this project deliberately keeps auth in a lightweight custom Context instead of Redux state — it's a natural fit for a single, app-wide value like "current user."

What it stores/exposes:
```ts
interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email, password) => Promise<void>;
  logout: () => void;
}
```

Walkthrough of what happens:

1. **On mount** (`useEffect`): if there's an `accessToken` cookie already (i.e., the user refreshed the page or came back later), it calls `getMyProfile()` to fetch the current user and populate `user`. If that call comes back with a genuine `401 Unauthorized`, it clears the cookie and logs the user out; any *other* error (network blip, 500, etc.) is ignored so a temporary glitch doesn't wrongly log someone out.
2. **`login(email, password)`**: calls the `login` mutation from `authApi`, gets back `{ accessToken, ...user fields }`, stores the token in a cookie via `setAccessToken` (from `lib/cookies.ts`), and sets `user` in local state.
3. **`logout()`**: clears the cookie and redirects to `/login`.
4. **`useAuth()`**: the hook every component actually calls — `const { user, login, logout } = useAuth()`. It throws an error if used outside `<AuthProvider>`, which is a common Context safety pattern (fails loudly instead of silently returning `undefined`).

This is why `login/page.tsx` never touches Redux or cookies directly — it just calls `await login(email, password)` from `useAuth()`, and all the token/cookie/user-state plumbing happens inside this file.

---

## 6. `lib/` — small, framework-agnostic helper functions

Two files, both intentionally tiny and dependency-light — "lib" is the conventional place (also matching the shadcn `components.json` alias config) for pure utility functions that don't belong to any one feature.

### `lib/cookies.ts`
```ts
getAccessToken()     // reads the "accessToken" cookie from document.cookie
setAccessToken(t)    // writes it (7-day expiry, path=/, samesite=lax)
removeAccessToken()  // clears it (max-age=0)
```
Every function starts with `if (typeof document === "undefined") return null` — this guards against running in a server context (Server Components, or `proxy.ts`) where `document` doesn't exist. This is a recurring theme in Next.js: code that touches browser-only globals (`document`, `window`) needs to defensively check for their existence, since the same file can be evaluated on the server during SSR.

This is the single source of truth for the auth cookie — both `baseApi.ts` (attaching the header) and `AuthContext.tsx` (login/logout) import from here rather than touching `document.cookie` directly.

### `lib/utils.ts`
```ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```
The near-universal shadcn/Tailwind helper: `clsx` lets you conditionally combine class names (e.g. `cn("px-2", isActive && "bg-primary")`), and `twMerge` resolves conflicts when combined classes overlap (e.g. two different `px-*` values — last one wins correctly instead of both being applied). You'll see `cn(...)` used throughout `components/` wherever a component accepts a `className` prop that needs to merge with its own default styles.

---

## 7. `constants/routes.ts` — centralized URL strings

```ts
export const ROUTES = {
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
  DASHBOARD: "/dashboard",
  DASHBOARD_BLOGS: "/dashboard/blogs",
  DASHBOARD_NEWSLETTER: "/dashboard/newsletter",
} as const;
```
Purely a convenience: instead of typing `"/dashboard/blogs"` as a string literal in five different files (and risking a typo in one of them), every redirect, `<Link href>`, and route-check imports `ROUTES` from here. `as const` makes TypeScript treat each value as its literal string type rather than widening to `string`, which is what allows `proxy.ts`'s `pathname.startsWith(ROUTES.DASHBOARD)` checks to stay type-safe.

---

## 8. `components/` — UI building blocks

This folder is split into three tiers, from most generic to most specific:

### `components/ui/` — design-system primitives (shadcn + base-ui)
Files like `button.tsx`, `input.tsx`, `select.tsx`, `dialog.tsx`, `table.tsx`, etc. These are **not hand-rolled** — they come from [shadcn](https://ui.shadcn.com/) (a CLI that copies component source into your repo, rather than installing an opaque npm package) built on top of **`@base-ui/react`** primitives (unstyled, accessible components — dropdowns, dialogs, selects — that handle keyboard nav/focus/ARIA correctly). Because the source lives in your repo (`components.json` records the shadcn config), you can freely edit these — e.g. `button.tsx` defines all button variants/sizes via `class-variance-authority` (`cva`), so `<Button variant="destructive" size="sm">` is fully your own code to tweak.

You generally don't build new files here by hand — you'd run the shadcn CLI to add a new primitive, then customize it.

### `components/dashboard/` — layout chrome
- **`sidebar.tsx`** — the desktop-only sidebar shell (`hidden md:flex`).
- **`sidebar-nav.tsx`** — the actual nav links + user avatar + logout button, shared between the desktop sidebar and the mobile menu. Reads `useAuth()` for the user's name/avatar and logout, and `usePathname()` (a Next.js hook returning the current URL) to highlight the active link.
- **`topbar.tsx`** — mobile-only header (`md:hidden`) with a hamburger menu that opens `sidebar-nav.tsx` inside a slide-out `Sheet`.

This mobile/desktop split (`hidden md:flex` vs `md:hidden`) is a pure-Tailwind responsive pattern: both components always render, but Tailwind's `md:` breakpoint utilities decide which is actually visible at a given screen width — cheaper than JS-based conditional rendering.

### `components/blogs/blog-form-dialog.tsx` and `components/pagination-controls.tsx` — feature components
- **`blog-form-dialog.tsx`** — the create/edit blog modal. It's feature-specific (knows about `BlogFormFields`, image uploads, SEO fields) rather than generic, so it lives outside `ui/`.
- **`pagination-controls.tsx`** — a small reusable "Previous / Page X of Y / Next" bar driven purely by a `PaginationMeta` object (from `redux/api/types.ts`) and an `onPageChange` callback — any paginated list page (blogs, newsletter) can drop this in without duplicating pagination UI/logic.

**Rule of thumb for where a new component goes:** generic + reusable across any future feature → `components/ui/`; layout chrome → `components/dashboard/`; tied to one domain's data shape → its own `components/<feature>/` folder (mirroring `components/blogs/`).

---

## 9. Putting it together: two end-to-end examples

**Example A — logging in:**
`login/page.tsx` (client component) → user submits form → calls `login()` from `useAuth()` (`context/AuthContext.tsx`) → that calls `useLoginMutation()` (`redux/api/authApi.ts`) → RTK Query POSTs to `/auth/login` via `baseApi`'s `fetchBaseQuery` → response envelope unwrapped by `transformResponse` → `AuthContext` stores the token (`lib/cookies.ts`) and the user object in state → `router.push(ROUTES.DASHBOARD_BLOGS)` navigates → `proxy.ts` sees the now-present cookie and lets the request through → the dashboard layout renders with `sidebar-nav.tsx` showing the logged-in user via `useAuth()`.

**Example B — viewing/filtering the blog list:**
`dashboard/blogs/page.tsx` calls `useGetBlogsQuery({ page, limit, search, status, visibility })` → `baseApi`'s `prepareHeaders` attaches the JWT from the cookie → GET `/blogs?...` → `transformResponse` in `blogApi.ts` splits the envelope into `{ items, meta }` → component renders the `Table` (from `components/ui/table.tsx`) and `PaginationControls` (from `redux/api/types.ts`'s `meta` shape). Editing/deleting a blog fires a mutation whose `invalidatesTags` triggers RTK Query to silently refetch this same list — no manual refresh code needed anywhere.

---

## Quick folder reference

| Folder | Contains | Answers the question |
|---|---|---|
| `app/` | Routes, layouts, the auth proxy | "What URL shows what, and who's allowed to see it?" |
| `redux/` | RTK Query API definitions + store | "How do I fetch/create/update backend data, with caching?" |
| `providers/` | One client-side wrapper component | "How do Redux/Context/Toaster get attached to a server-rendered app?" |
| `context/` | `AuthContext` | "Who's logged in, and how do I log in/out from any component?" |
| `lib/` | `cookies.ts`, `utils.ts` | "Where are small framework-agnostic helpers?" |
| `constants/` | `routes.ts` | "What's the canonical string for this URL?" |
| `components/ui/` | shadcn/base-ui primitives | "What's our design-system building block for X?" |
| `components/dashboard/`, `components/blogs/` | Feature/layout-specific components | "What renders this specific piece of UI?" |
