# WK Travel & Tours: Production Web Platform

A production-quality travel agency platform built for **WK Travel & Tours (Karachi, Pakistan)**, featuring verified tour packages, promotional banner sliders, customizable itineraries, persistent cart calculations, WhatsApp booking dispatch, and Supabase integration.

---

## 1. Verified Agency Information

- **Brand:** WK Travel & Tours
- **Tagline:** Journeys Beyond Boundaries
- **Office Location:** Royal Defence Mall, 3rd Floor, Office No. 101, Karachi, Pakistan
- **Primary Contact:** +92 337 2614742 (Call / WhatsApp)
- **Secondary Contact:** +92 302 2614742 (Call / WhatsApp)

---

## 2. Technical Stack

- **Framework:** Next.js 15 (App Router, Server & Client Components)
- **Language:** JavaScript (ESNext, JSX) with path alias `@/*` -> `src/*`
- **Styling:** Tailwind CSS (Custom luxury editorial palette: Deep Navy, Desert Gold, Warm Ivory Sand)
- **Typography:** `Plus Jakarta Sans` (Body) + `Playfair Display` (Headings) via `next/font/google`
- **Animations:** Framer Motion (Restrained, accessible motion)
- **State Management:** Zustand (Persistent cart store with integer calculations)
- **Validation:** Zod (Strict client & server validation schemas)
- **Backend & Database:** Supabase (PostgreSQL with Row Level Security, Auth, Storage)
- **Communication:** Native WhatsApp booking dispatch via `wa.me` links

---

## 3. Project Directory Architecture

```
wk-travel-tours/
├── public/
│   ├── images/
│   │   ├── logo/
│   │   │   └── wk-travel-logo.jpeg
│   │   ├── packages/
│   │   │   ├── thailand-bangkok-pattaya-phuket.jpeg
│   │   │   ├── asia-grand-tour-4-countries.jpeg
│   │   │   ├── asia-explorer-5-countries.jpeg
│   │   │   ├── baku-azerbaijan-tour.jpeg
│   │   │   ├── malaysia-kuala-lumpur-langkawi.jpeg
│   │   │   ├── dubai-city-of-dreams.jpeg
│   │   │   ├── turkey-istanbul-cappadocia-antalya.jpeg
│   │   │   ├── bali-indonesia-island-of-gods.jpeg
│   │   │   └── 4-in-1-visit-visa-package.jpeg
│   │   ├── banners/
│   │   │   ├── family-package-banner.jpeg
│   │   │   ├── friends-vip-banner.jpeg
│   │   │   └── honeymoon-package-banner.jpeg
│   │   ├── reviews/
│   │   └── our-work/
│   └── fonts/
├── src/
│   ├── app/
│   │   ├── (website)/
│   │   │   ├── page.jsx
│   │   │   ├── packages/
│   │   │   │   ├── page.jsx
│   │   │   │   └── [slug]/page.jsx
│   │   │   ├── custom-trip/page.jsx
│   │   │   ├── reviews/page.jsx
│   │   │   └── our-work/page.jsx
│   │   ├── (auth)/
│   │   │   └── login/page.jsx
│   │   ├── admin/
│   │   ├── api/
│   │   ├── layout.jsx
│   │   ├── globals.css
│   │   ├── not-found.jsx
│   │   └── error.jsx
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── home/
│   │   ├── packages/
│   │   ├── cart/
│   │   ├── forms/
│   │   ├── reviews/
│   │   └── admin/
│   ├── features/
│   │   ├── auth/
│   │   ├── packages/
│   │   ├── bookings/
│   │   ├── cart/
│   │   ├── custom-trips/
│   │   ├── reviews/
│   │   └── media/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── validation/
│   │   ├── security/
│   │   └── utils/
│   ├── services/
│   ├── stores/
│   ├── config/
│   └── types/
├── supabase/
│   ├── migrations/
│   │   └── 00001_initial_schema.sql
│   └── seed.sql
├── tests/
│   ├── sanity.test.js
│   ├── formatters.test.js
│   ├── booking.test.js
│   ├── cart.test.js
│   ├── packages.test.js
│   └── reviews.test.js
├── .env.example
├── .gitignore
├── next.config.mjs
├── tailwind.config.mjs
├── postcss.config.mjs
├── jsconfig.json
├── package.json
└── README.md
```

---

## 4. Setup & Running Locally

### Prerequisites
- Node.js 18+ (tested on Node v24.19.0)
- npm 10+ (tested on npm 11.17.0)

### Installation
```bash
cd "c:\Users\DELL\wk travel agency web\wk-travel-tours"
npm install
```

### Environment Configuration
Copy the template environment file:
```bash
cp .env.example .env.local
```
Fill in your Supabase project credentials if database synchronization is enabled. The application automatically falls back to verified client seed assets if Supabase is offline.

### Running Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Automated Tests
```bash
npm test
```

### Production Build
```bash
npm run build
npm start
```

---

## 5. Verified Client Assets & Package Mapping

| Category | Package / Asset Name | Stored File | Confirmed Price |
| :--- | :--- | :--- | :--- |
| **Branding** | WK Travel & Tours Official Logo | `public/images/logo/wk-travel-logo.jpeg` | N/A |
| **Promotional Banner** | Family's Package Available | `public/images/banners/family-package-banner.jpeg` | Custom Trip |
| **Promotional Banner** | VIP Friends Package (Min 4 Pax) | `public/images/banners/friends-vip-banner.jpeg` | Custom Trip |
| **Promotional Banner** | Honeymoon Customized Package | `public/images/banners/honeymoon-package-banner.jpeg` | Custom Trip |
| **Package** | Explore Thailand (Bangkok, Pattaya, Phuket) | `public/images/packages/thailand-bangkok-pattaya-phuket.jpeg` | PKR 360,000 |
| **Package** | 4-Country Asia Grand Tour (Sri Lanka, Malaysia, Thailand, Singapore) | `public/images/packages/asia-grand-tour-4-countries.jpeg` | PKR 430,000 |
| **Package** | 5-Country Asia Explorer (Sri Lanka, Malaysia, Thailand, Indonesia, Vietnam) | `public/images/packages/asia-explorer-5-countries.jpeg` | PKR 500,000 |
| **Package** | Explore Baku (Azerbaijan) | `public/images/packages/baku-azerbaijan-tour.jpeg` | PKR 260,000 |
| **Package** | Kuala Lumpur & Langkawi (Malaysia) | `public/images/packages/malaysia-kuala-lumpur-langkawi.jpeg` | PKR 275,000 |
| **Package** | Explore Dubai (UAE) | `public/images/packages/dubai-city-of-dreams.jpeg` | PKR 220,000 |
| **Package** | Explore Turkey (Istanbul, Cappadocia, Antalya) | `public/images/packages/turkey-istanbul-cappadocia-antalya.jpeg` | PKR 320,000 |
| **Package** | Explore Bali (Indonesia) | `public/images/packages/bali-indonesia-island-of-gods.jpeg` | PKR 350,000 |
| **Package** | 3-Country Asia Discovery (Sri Lanka, Malaysia, Thailand) | `public/images/packages/sri-lanka-malaysia-thailand.jpeg` | PKR 350,000 |
| **Package** | 4-in-1 Visit Visa (Sri Lanka, Malaysia, Thailand, Indonesia) | `public/images/packages/4-in-1-visit-visa-package.jpeg` | PKR 65,000 |

---

## 6. FINAL DATABASE SETUP: RUN ONCE

All required database schemas, tables, constraints, foreign keys, indexes, triggers, Row Level Security (RLS) policies, storage buckets, and seed records have been consolidated into one idempotent, dependency-safe file:

**`supabase/FINAL_SETUP_ALL_IN_ONE.sql`** (1,749 lines)

### Step-by-Step Execution Instructions:

1. **Log in to Supabase**: Navigate to your project on the [Supabase Dashboard](https://supabase.com/dashboard).
2. **Open SQL Editor**: In the left sidebar, click on the **SQL Editor** tab (the `>_` terminal icon).
3. **Create New Query**: Click **+ New Query** at the top.
4. **Copy Master Script**: Open [`supabase/FINAL_SETUP_ALL_IN_ONE.sql`](supabase/FINAL_SETUP_ALL_IN_ONE.sql) on your computer, select all (`Ctrl+A`), and copy (`Ctrl+C`).
5. **Paste and Execute**: Paste the SQL into the Supabase editor and click the green **Run** button (or press `Ctrl+Enter`).
6. **Verify the Results**:
   Run the verification query at the bottom of the script:
   ```sql
   select 
     (select count(*) from public.packages) as total_packages,
     (select count(*) from public.categories) as total_categories,
     (select count(*) from public.promotional_banners) as total_banners,
     (select count(*) from public.reviews) as total_reviews,
     (select count(*) from storage.buckets where id in ('package-images', 'banners', 'agency-work', 'avatars')) as total_buckets;
   ```
   *Expected Output:*
   - `total_packages`: 17
   - `total_categories`: 7
   - `total_banners`: 3
   - `total_reviews`: 4
   - `total_buckets`: 4

7. **Administrator Account Elevation**:
   - Register the administrator account at `/register` using `wktravelandtour@gmail.com`.
   - The database trigger (`on_auth_user_created`) automatically elevates `wktravelandtour@gmail.com` to `role: 'admin'` upon account creation.
   - Dual-administrator support is also enabled for `admin@wktravel.pk`.


