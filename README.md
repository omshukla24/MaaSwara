# MaaSwara: A Mother's Voice
**An AI-Powered Multilingual Antenatal Triage Engine for Low-Resource Environments.**

MaaSwara is a full-stack, multimodal triage platform that bridges the gap between rural mothers and professional healthcare clinics. It allows expecting mothers to interact in their native tongue via voice or text. The AI processes symptoms against WHO clinical guidelines and instantly flags urgent cases to a live, geolocated clinic dashboard.

## 🚀 Live Demo Access

| Interface | URL | Description |
|---|---|---|
| **Patient Web App** | `https://maa-swara.vercel.app` | Main entry point for patients (Voice & Web Chat). |
| **Telegram Bot** | `@MaaSwarabot` | Low-bandwidth interface for 2G network environments. |
| **Provider Dashboard** | `https://maa-swara.vercel.app/clinic` | Secure dashboard for clinic staff to monitor live alerts. |

> **Demo Access Credentials**  
> To access the Provider Dashboard, use the password: **`maaswara2026`**

---

## 🌍 Multilingual Channels

MaaSwara natively supports 6 languages (English, Hindi, Bhojpuri, Swahili, Yoruba, Hausa) across three distinct accessibility tiers:

| Channel | Interaction Mode | Target Environment | Tech Implementation |
|---|---|---|---|
| **Voice Call** | Immersive Audio | High Bandwidth / Low Literacy | Gemini Multimodal Live API (WebSocket) |
| **Web Chat** | Text Interface | Medium Bandwidth | Next.js API Routes + Gemini 2.5 Flash |
| **Telegram Bot** | SMS-style Text | Extreme Low Bandwidth (2G) | Next.js Webhook + Telegram Bot API |

---

## 🏗️ System Architecture

MaaSwara utilizes a unified triage engine that securely handles input from all channels, processes it through a strict safety pipeline, and synchronizes alerts to the frontend via Supabase Realtime.

```text
┌──────────────────────────────────────────────┐
│              MaaSwara Interfaces             │
│   Voice Call (PCM16)  │  Web Chat  │  Telegram │
└─────────┬──────────────────┬─────────────┬───┘
          │ (WebSocket)      │ (HTTP)      │ (Webhook)
┌─────────▼──────────────────▼─────────────▼───┐
│              Next.js 14 Backend              │
│       /api/live-token    /api/chat           │
│       /api/telegram/webhook                  │
└──────────────────────┬───────────────────────┘
                       │
┌──────────────────────▼───────────────────────┐
│        Universal Triage Engine Pipeline      │
│  1. LLM Evaluation (Gemini 2.5 Flash)        │
│  2. JSON Parsing & Validation                │
│  3. Deterministic Safety Net Override        │
└──────┬───────────────────────────────┬───────┘
       │ (If RED / URGENT)             │
┌──────▼───────────────────┐    ┌──────▼───────┐
│  Supabase PostgreSQL     │    │  User Output │
│  INSERT INTO alerts      │    │  (Audio/Text)│
└──────┬───────────────────┘    └──────────────┘
       │ (Realtime Sync)
┌──────▼───────────────────┐
│  Clinic Dashboard        │
│  (Secured via Proxy)     │
└──────────────────────────┘
```

### 🛡️ The Triage Engine Pipeline
The core of MaaSwara runs on a dual-layered pipeline to prevent medical hallucinations:

1. **LLM Evaluation**: Input is passed to Gemini 2.5 Flash with a strict `SYSTEM_PROMPT` containing the 11 WHO Danger Signs of Pregnancy.
2. **Deterministic Safety Net**: Every transcript is simultaneously scanned by a deterministic, multilingual keyword engine. If a high-risk symptom (e.g., "bleeding") is detected, the system forces a mathematical `RED` severity override, regardless of the LLM's classification.

---

## 🔐 Security & HIPAA Compliance Architecture

Because MaaSwara handles sensitive Protected Health Information (PHI), the Provider Dashboard is strictly secured.

### Demonstration Setup (Current)
For the purpose of easy Vercel deployment, the `/clinic` dashboard is protected by a **Next.js Edge Proxy (Middleware)**. Unauthenticated requests are intercepted and redirected to `/clinic/login`. The session is managed via a secure, HTTP-only cookie (`maaswara_clinic_auth`).

### Enterprise Production Setup (Future)
In a true hospital deployment, the middleware proxy integrates with an enterprise Identity Provider (IdP):
1. **SSO Integration:** Clinics authenticate via enterprise Identity Providers (Okta, Auth0) or Supabase Auth.
2. **Row Level Security (RLS):** Every authenticated doctor is assigned a `clinic_id` JWT claim. Supabase RLS policies are strictly enforced at the database level so a clinic can *only* SELECT alerts geofenced to their specific facility (`alerts.clinic_id = auth.jwt().clinic_id`), preventing cross-clinic data leakage entirely.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Vanilla CSS Modules
- **Backend**: Next.js Edge APIs, Node.js
- **Database & Realtime**: Supabase (PostgreSQL + PostGIS for spatial queries)
- **AI Core**: Google Gemini 2.5 Flash, Gemini Multimodal Live API (`v1beta`)
- **APIs**: Telegram Bot API, Web Audio API

---

## 💻 Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/omshukla24/MaaSwara.git
   cd MaaSwara
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure Environment Variables:**
   Rename `.env.example` to `.env.local` and add your API keys.
4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
