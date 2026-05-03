# MaaSwara: AI Antenatal Triage Platform

MaaSwara is a multilingual, multimodal AI platform designed to triage maternal health symptoms in low-resource environments. It features a conversational interface powered by Google's Gemini 2.5 Flash, a real-time clinic dashboard, and seamless Telegram integration for low-bandwidth access.

## Live Demo Access

- **Patient Web App:** [App URL]
- **Telegram Bot:** `@MaaSwarabot`
- **Clinic Provider Dashboard:** [App URL]/clinic

### 🔐 Demo Login Credentials
To access the live triage alerts in the **Clinic Provider Dashboard**, please use the following demo password:
**`maaswara2026`**

---

## Security & HIPAA Compliance Architecture

Because MaaSwara handles sensitive Protected Health Information (PHI), security and privacy are paramount.

### Demonstration Setup (Current)
For the purpose of easy Vercel deployment and demonstration, the `/clinic` Provider Dashboard is protected using a universal passphrase managed via **Next.js Middleware**. 

When a user attempts to access `/clinic`, the Middleware intercepts the request at the edge. If a secure, HTTP-only cookie (`maaswara_clinic_auth`) is missing, it redirects them to `/clinic/login`. The server action verifies the password (`maaswara2026`) and sets the cookie, simulating a basic authenticated session.

### Enterprise Production Setup (Future)
In a real-world hospital deployment, the universal demo password will be completely replaced with an enterprise-grade Identity Provider (IdP) integration.

1. **Role-Based Access Control (RBAC):**
   - The platform will integrate with **Supabase Auth** or a hospital SSO (Single Sign-On) provider like **Okta**, **Auth0**, or **Google Workspace**.
   - Doctors, nurses, and clinic administrators will log in using their secure, multi-factor authenticated (MFA) credentials.

2. **Row Level Security (RLS) Filtering:**
   - Every user will be assigned a `clinic_id` in their JWT payload.
   - The `alerts` table in the database is already architected with a `clinic_id` foreign key.
   - We will enable Supabase **Row Level Security (RLS)** policies that strictly enforce that a doctor can *only* SELECT alerts where `alerts.clinic_id = auth.jwt().clinic_id`. This prevents cross-clinic data leakage entirely.

3. **Edge Verification:**
   - The Next.js Middleware will be updated to verify the cryptographic signature of the user's JWT at the edge, ensuring unauthenticated requests never reach the server rendering phase.

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **AI Model:** Google Gemini 2.5 Flash / Multimodal Live API
- **Database & Realtime:** Supabase (PostgreSQL)
- **Styling:** Vanilla CSS Modules / Tailwind
- **Integrations:** Telegram Bot API
