# Security Architecture & Verification Protocols: WK Travel & Tours

This document details the security posture, authentication flows, data protection policies, authorization boundaries, and server hardening implemented across the **WK Travel & Tours** application.

---

## 1. Authentication & Session Security

- **Provider:** Supabase Auth (leveraging encrypted JWT tokens and HTTP-only cookie synchronization via `@supabase/ssr`).
- **No Hardcoded Credentials:** The application does not store admin passwords, mock secrets, or hardcoded tokens in any repository file.
- **Server Role Verification:** Client-side flags (`isAdmin = true`) or URL tampering can never grant administrative privileges. All administrative mutations are authorized by querying the authenticated user ID (`auth.uid()`) against `public.profiles` on the server and within PostgreSQL Row Level Security policies.
- **Middleware Guard:** [`src/middleware.js`](./src/middleware.js) intercepts requests targeting `/admin/*` routes. Unauthenticated or non-admin users are immediately redirected with appropriate error parameters.

---

## 2. PostgreSQL Row Level Security (RLS) Matrix

Every database table in `supabase/migrations/00001_initial_schema.sql` enforces RLS:

| Table | Public Read | Public Insert | Admin Access |
| :--- | :--- | :--- | :--- |
| `profiles` | Self-only (`auth.uid() = id`) | Auto via trigger | Full read & update |
| `packages` | Active packages only (`is_active = true`) | Forbidden | Full CRUD |
| `categories` | Viewable by all | Forbidden | Full CRUD |
| `promotional_banners` | Active banners only | Forbidden | Full CRUD |
| `reviews` | Approved reviews only (`status = 'approved'`) | Pending submission only (`status = 'pending'`) | Full moderation |
| `agency_work` | Published items only (`is_published = true`) | Forbidden | Full CRUD |
| `booking_requests` | Forbidden (private customer data) | Allowed with validation | Full read & update |
| `custom_trip_requests` | Forbidden (private customer data) | Allowed with validation | Full read & update |

---

## 3. Storage Bucket Security

- **Public Read Access:** Buckets `packages`, `banners`, `agency-work`, and `reviews` permit public `SELECT` for displaying images in web components.
- **Admin-Only Mutations:** `INSERT`, `UPDATE`, and `DELETE` on storage objects require verified `role = 'admin'` credentials.

---

## 4. HTTP Security Headers (Hardening via next.config.mjs)

The application enforces strict HTTP response headers across all routes to prevent clickjacking, MIME sniffing, and browser cross-site vulnerabilities:

| Header | Configured Value | Protection Provided |
| :--- | :--- | :--- |
| `X-Content-Type-Options` | `nosniff` | Blocks MIME-type sniffing attacks |
| `X-Frame-Options` | `DENY` | Prevents iframe embedding and clickjacking attacks |
| `X-XSS-Protection` | `1; mode=block` | Re-enables browser XSS filtering defense |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Protects private URL parameters on external navigations |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables sensitive browser hardware permissions |

---

## 5. Input Validation & Defense in Depth

- **Zod Schemas:** Validates all booking payloads, custom trip submissions, package management payloads, and reviews before database transactions occur.
- **Integer Arithmetic:** Prices and traveler multipliers use integer values in Pakistani Rupees (PKR) to prevent floating-point rounding inaccuracies.
- **Safe Persistence:** Local storage (`customerStore` and `cartStore`) stores only non-sensitive preferences (e.g. customer name, contact phone, selected itinerary slugs). Authentication tokens and passwords are never stored in client-side state.

---

## 6. Administrative Role Setup

To designate an authorized agency operator as an administrator in production:

```sql
-- Step 1: Verify the registered user account in Supabase SQL Editor
SELECT id, email, created_at FROM auth.users WHERE email = 'admin@wktravel.pk';

-- Step 2: Elevate the associated public profile to admin
UPDATE public.profiles
SET role = 'admin', updated_at = NOW()
WHERE email = 'admin@wktravel.pk';

-- Step 3: Verify the updated role
SELECT id, email, role FROM public.profiles WHERE email = 'admin@wktravel.pk';
```

---

## 7. Deployment Security Checklist

1. [ ] Maintain `.env.local` strictly in `.gitignore`. Never commit service role keys or database connection strings.
2. [ ] Apply the schema migration: `supabase db push` or execute [`supabase/migrations/00001_initial_schema.sql`](./supabase/migrations/00001_initial_schema.sql) in the Supabase SQL editor.
3. [ ] Seed initial verified packages using [`supabase/seed.sql`](./supabase/seed.sql).
4. [ ] Promote the verified agency owner to `admin` in `public.profiles` using the Supabase SQL commands above.
5. [ ] Verify SSL/TLS certificates and configure production domain DNS (`wktravel.pk`).
