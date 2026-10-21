# WK Travel & Tour — Supabase Production SQL Runbook
## Single-Run Master Execution Guide & Remote Setup

**File to Execute:** [`supabase/wk-travel-final-consolidated.sql`](file:///c:/Users/DELL/wk%20travel%20agency%20web/wk-travel-tours/supabase/wk-travel-final-consolidated.sql)  
**Target Administrator Email:** `wktravelandtour@gmail.com` (with fallback support for `admin@wktravel.pk`)  
**Project:** WK Travel & Tours (Pvt) Ltd. — Karachi, Pakistan

---

## 1. Overview & Idempotence Guarantee

`supabase/wk-travel-final-consolidated.sql` has been designed as a single, idempotent master script. You can run it once or rerun it multiple times safely without causing data loss, syntax errors, or primary key collisions.

### Key Protections Built-In:
1. **Additive Schema Modifications:** Uses `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` across all tables (`profiles`, `packages`, `categories`, `custom_trip_requests`, `bookings`, `reviews`, `promotional_banners`, `agency_work`, `email_otp_codes`). This prevents any "column does not exist" errors on pre-existing projects.
2. **RFC 4122 Compliant UUIDs:** All seeded primary keys use standard hex UUIDs (`a1000000-0000-0000-0000-000000000001` through `e1000000-0000-0000-0000-000000000005`), completely eliminating PostgreSQL syntax error `22P02`.
3. **Upsert Protection:** Uses `ON CONFLICT (id) DO UPDATE` so repeated executions update existing records rather than throwing primary key violation errors.
4. **Row-Level Security (RLS):** All tables have RLS enabled with granular public `SELECT` policies and administrative write privileges.
5. **Dual Admin Elevation:** Automatically promotes `wktravelandtour@gmail.com` and `admin@wktravel.pk` to `role = 'admin'` if they are registered, and installs the `handle_new_user()` trigger so they are automatically granted admin status whenever they register or log in.

---

## 2. Step-by-Step Execution in Supabase SQL Editor

Follow these exact steps:

### Step 2.1: Open Supabase Dashboard
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your WK Travel & Tours project.
3. Click on the **SQL Editor** tab (the `>_` terminal icon on the left sidebar).

### Step 2.2: Create a New Query
1. Click **+ New query**.
2. Name the query tab: `WK Travel Master Migration`.

### Step 2.3: Paste and Execute
1. Open [`supabase/wk-travel-final-consolidated.sql`](file:///c:/Users/DELL/wk%20travel%20agency%20web/wk-travel-tours/supabase/wk-travel-final-consolidated.sql) in your code editor.
2. Select all (`Ctrl + A`) and Copy (`Ctrl + C`).
3. Paste (`Ctrl + V`) into the Supabase SQL Editor query window.
4. Click the green **Run** button (or press `Ctrl + Enter`).

---

## 3. Expected Verification Output

At the bottom of the SQL script, a verification query runs automatically:

```sql
select 
  (select count(*) from public.packages) as total_packages,
  (select count(*) from public.categories) as total_categories,
  (select count(*) from public.promotional_banners) as total_banners,
  (select count(*) from public.reviews) as total_reviews,
  (select count(*) from public.agency_work) as total_agency_work,
  (select count(*) from public.profiles where role = 'admin') as total_admins;
```

### Expected Results Table:

| Metric | Expected Value | Status Notes |
| :--- | :--- | :--- |
| `total_packages` | **12** | 12 client-verified holiday tours and visas |
| `total_categories` | **7** | Featured, Solo, Friends, Family, Honeymoon, Visa, Group |
| `total_banners` | **6** | Hero and promotional banners pointing to custom trip |
| `total_reviews` | **5** | Verified 5-star customer testimonials |
| `total_agency_work` | **7** | Verified tour execution & visa approval proofs |
| `total_admins` | **≥ 1** | Shows count of active admin profiles (`wktravelandtour@gmail.com`) |

---

## 4. Admin Account Setup & Verification

### Step 4.1: Register Admin Email in Supabase Auth
If you have not yet created the user account in Supabase Authentication:
1. Navigate to **Authentication** -> **Users** in your Supabase dashboard.
2. Click **Add user** -> **Create user**.
3. Enter:
   - **Email:** `wktravelandtour@gmail.com`
   - **Password:** A strong password of your choice (e.g., for password login tab).
   - Check **Auto Confirm User?** -> **Yes**.
4. Click **Create user**.

### Step 4.2: Verify Admin Role in SQL
Run this quick query in the SQL Editor:
```sql
SELECT id, email, role, full_name, created_at 
FROM public.profiles 
WHERE email = 'wktravelandtour@gmail.com';
```

If the user was already registered before running the master script, their role will be `admin`. If they registered afterward, the `handle_new_user()` trigger has automatically assigned them `admin`.

If you ever need to manually force an email to admin:
```sql
UPDATE public.profiles
SET role = 'admin', updated_at = NOW()
WHERE email = 'wktravelandtour@gmail.com';
```

---

## 5. Storage Bucket Configuration

The master migration automatically creates the `package-media` public storage bucket and applies public read and admin write policies.

To verify in the dashboard:
1. Navigate to **Storage** -> **Buckets**.
2. Ensure `package-media` is present with the **Public** badge.
3. Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`.

---

## 6. Remote SMTP Configuration for Production 4-Digit OTP

The application includes a built-in cryptographic 4-digit OTP engine (`src/lib/security/otpService.js`) with an API route (`/api/auth/otp/send` and `/api/auth/otp/verify`).

In local/development mode, OTP codes are logged to the server console and securely stored in memory and the database table `public.email_otp_codes`.

For production live email dispatch to `wktravelandtour@gmail.com` or customer emails, configure a production SMTP provider in Supabase or your hosting environment (.env.local / Vercel):

### Option A: Supabase Custom SMTP (Settings -> Auth -> SMTP Settings)
- **Sender Email:** `info@wktravel.pk` or `wktravelandtour@gmail.com`
- **Sender Name:** `WK Travel & Tours`
- **Host:** `smtp.resend.com` (or SendGrid / AWS SES / Gmail SMTP `smtp.gmail.com`)
- **Port:** `587` or `465`
- **Username:** `resend` or your SMTP username
- **Password:** Your SMTP API key or Google App Password

### Option B: Direct Environment Variables (Vercel / Next.js)
```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_your_api_key_here
SMTP_FROM=info@wktravel.pk
OTP_SECRET=wk-travel-secure-otp-salt-2026-production
```

---

## 7. Troubleshooting Common Queries

### Q: What if an error says "relation profiles already exists"?
The script uses `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, so this will never halt execution.

### Q: What if I see "duplicate key value violates unique constraint"?
The script uses `ON CONFLICT (id) DO UPDATE` on all seed data, completely preventing primary key violations.

### Q: How do I test the 4-digit OTP login in the browser?
1. Start the app: `npm run dev`.
2. Visit `http://localhost:3000/login`.
3. Select the **4-Digit Email OTP** tab.
4. Enter `wktravelandtour@gmail.com` and click **Send 4-Digit Code**.
5. Check your server terminal console for the log:
   `[OTP Service] 4-digit code for wktravelandtour@gmail.com: XXXX`.
6. Enter the 4-digit code in the inputs and click **Verify & Sign In**.
7. The session is authenticated and redirects to `/admin` or `/profile`.

