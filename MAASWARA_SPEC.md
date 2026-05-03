# MaaSwara — Full Project Specification

> *"A mother's voice, in her own voice."*
> Voice-first antenatal danger-sign triage for low-literacy women in the global south.

**Built for:** GNEC Hackathon Spring 2026 — UN SDG 3 (Health & Well-being)
**Build environment:** Google Antigravity
**Author:** Om
**License:** MIT (per hackathon rules — open source required)

---

## 0. Executive Summary

MaaSwara is a **voice-first conversational triage system** that helps pregnant women in low-literacy, low-resource regions detect WHO-defined antenatal danger signs in their own dialect. It runs across **three live channels powered by three distinct Gemini models**, all sharing one triage engine, and routes urgent cases to a partner-NGO clinic dashboard in real time.

**The three channels:**
1. **Web app — voice call** (Gemini Live native audio)
2. **Web app — text chat box** (Gemini 2.5 Flash)
3. **Telegram bot** (Gemini 2.5 Flash-Lite, separate adapter)

All three call into the same triage engine in `lib/triage/` so classifications stay consistent. Splitting models gives you quota isolation and lets each channel use the model best suited to its constraints.

**Why it wins this hackathon:**
- Direct line to **SDG 3.1** (maternal mortality reduction)
- Voice-first solves the **literacy barrier** every health app ignores
- Solo-buildable, free-tier deployable, judge-testable in 60 seconds
- NGO-ready: GNEC has 1,600 subsidiaries — the deployment path is obvious

---

## 1. The Problem (Opening Story for Demo)

Every day, **~700 women die from preventable pregnancy complications.** 95% of these deaths happen in low- and middle-income countries. The most lethal causes — preeclampsia, hemorrhage, sepsis — all have warning signs that families *would* act on if they recognized them.

But the women most at risk often:
- Cannot read (rural literacy in northern India and West Africa is below 50% for women)
- Do not own the household phone (a husband or mother-in-law does)
- Speak regional dialects (Bhojpuri, Yoruba, Hausa) that mainstream health apps don't support
- Live hours from the nearest clinic

**Existing health apps assume a literate, smartphone-fluent user. MaaSwara doesn't.** A woman picks up a phone, says "my head hurts and I can't see properly," and within 30 seconds she's being told — in her own language — to get to a clinic *now*, while a partner NGO clinic 12 km away receives her location and an alert.

---

## 2. What You Are Actually Building

### 2.1 Three deployable surfaces, one shared engine

| Surface | Audience | Purpose | Hosted on |
|---|---|---|---|
| **Web app — Patient view** | Demo / web users | Voice + text triage in browser | Vercel |
| **Web app — Clinic dashboard** | NGO clinic staff | Receive real-time alerts | Vercel (same project) |
| **Telegram bot** | Anyone with Telegram | Triage via chat + voice notes | Vercel serverless |

All three hit the same backend triage engine and write to the same alerts store. **One deploy, three demos.**

### 2.2 Why these three, not WhatsApp/Twilio

- **WhatsApp Business API** requires Meta business verification (days–weeks, you cannot get this in time).
- **Twilio Voice** costs money per minute (you have no budget).
- **Telegram bots** are free, instant, no verification, work globally, support voice notes natively.
- **Web app** is your portfolio strength and lets you demo the Gemini Live native-audio experience.

The README will tell organizations *with* resources how to plug in WhatsApp Business and IVR phone lines using the same backend (covered in §11).

---

## 3. Tech Stack

### 3.1 Stack at a glance

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | One repo, frontend + serverless functions, deploys to Vercel in one click |
| Hosting | **Vercel** | Free tier covers everything we need |
| Styling | **Tailwind CSS + shadcn/ui** | Speed + your design strength |
| Animations | **Framer Motion** | For the call interface and dashboard transitions |
| **AI #1 — Web voice** | **Gemini Live API (native audio)** via WebSocket with ephemeral tokens | Real low-latency spoken dialog for `/call` page |
| **AI #2 — Web chat box** | **Gemini 2.5 Flash** via `@google/generative-ai` SDK | Fast multilingual text for `/chat` page |
| **AI #3 — Telegram bot** | **Gemini 2.5 Flash-Lite** (text + audio input multimodal) | Separate model + code path; lighter footprint for higher-volume bot traffic on free tier |
| Telegram framework | **`grammy` (Node)** in Vercel webhook mode | Serverless-friendly, no always-on host needed |
| Realtime alerts | **Supabase free tier** (Postgres + realtime) | Clinic dashboard updates instantly when triage triggers |
| State (clientside) | **Zustand** | Lighter than Redux, sufficient |
| i18n display strings | **next-intl** | Hindi, Swahili, Yoruba, English UI labels |

### 3.2 Three AI integrations — explicit model split

You are running **three distinct AI integrations**, each with its own model, code path, and free-tier quota bucket. They share the triage *logic* (system prompt, danger-sign codes, severity scorer in `lib/triage/`) but call different Gemini models.

> Note: Google rebrands these often. Verify exact model IDs in Google AI Studio when you start. The **roles** below are stable; the IDs below are best-guess.

#### AI #1 — Web app voice (`/call` page)
| | |
|---|---|
| **Surface** | Web app, voice call view |
| **Model role** | Live API native-audio dialog (real-time spoken in & out) |
| **Suggested ID** | `gemini-2.5-flash-native-audio-preview` (or current Live native-audio model — check AI Studio "Live" section) |
| **Transport** | WebSocket from browser, secured with ephemeral token from `/api/live-token` |
| **Why this model** | Native audio handles turn-taking, prosody, interruption, and accents in regional dialects. No transcription step — audio in, audio out. |
| **Free-tier note** | Live sessions are time-limited on free tier. Fine for a 3-min demo, not for production scale. |

#### AI #2 — Web app chat box (`/chat` page)
| | |
|---|---|
| **Surface** | Web app, text chat view |
| **Model role** | Fast multilingual text dialog with structured output |
| **Suggested ID** | `gemini-2.5-flash` |
| **Transport** | REST via Next.js `/api/chat` route (server-side, API key never exposed) |
| **Why this model** | 2.5 Flash has the best speed + multilingual + structured-output combo on free tier. Handles 6 languages cleanly and emits JSON triage blocks reliably. |
| **Free-tier note** | Generous quota — comfortably handles demo + casual portfolio traffic. |

#### AI #3 — Telegram bot (separate adapter)
| | |
|---|---|
| **Surface** | Telegram bot (`@YourBotName`) |
| **Model role** | Lightweight multimodal: text in + voice notes in (audio understanding) |
| **Suggested ID** | `gemini-2.5-flash-lite` (text) + `gemini-2.5-flash` (voice notes only, since Lite may not support audio input — verify in AI Studio) |
| **Transport** | Webhook → `/api/telegram` route → grammy → Gemini SDK |
| **Why a different model** | Telegram traffic patterns differ: shorter messages, higher message count, no live session. Flash-Lite is faster + uses less of your quota, leaving headroom for the web models. The voice-note path falls back to full Flash because audio input may not be supported on Lite. |
| **Free-tier note** | Flash-Lite has the highest free-tier limits of the family — ideal for a public bot anyone might message. |

#### Why split them this way
1. **Quota isolation** — if someone spams the Telegram bot, your `/call` and `/chat` demos still work because they're hitting different model buckets.
2. **Right tool for the job** — voice needs Live, chat needs structured output, Telegram needs throughput. Different optimization axes.
3. **Demo story** — "three channels, three models, one shared triage engine" is a strong architectural narrative for judges.
4. **Failure independence** — if Live API has an outage during demo, your chat + Telegram still work.

### 3.3 Free-tier sanity check

- **Gemini 2.5 Flash** (web chat) — generous free tier, comfortably handles demo + portfolio traffic
- **Gemini 2.5 Flash-Lite** (Telegram) — highest free quota in the family, ideal for a public bot
- **Gemini Live** (web voice) — free tier exists but session-time-limited; fine for demos, not for production scale
- Splitting models across **3 quota buckets** means Telegram spam can't break your live voice demo
- Vercel hobby tier: free, sufficient
- Supabase free tier: 500MB DB, plenty for alert records
- Telegram Bot API: free, no limits that matter at this scale

---

## 4. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         USER LAYER                           │
├──────────────────────┬───────────────────────┬───────────────┤
│  Web Patient View    │   Telegram Bot        │  Clinic Dash  │
│  (voice + chat)      │   (text + voice notes)│  (NGO view)   │
└──────────┬───────────┴───────────┬───────────┴───────┬───────┘
           │                       │                   │
           │ WebSocket (Live)      │ Webhook           │ Realtime
           │ + REST (chat)         │                   │ subscribe
           │                       │                   │
┌──────────▼───────────────────────▼───────────────────▼───────┐
│                    NEXT.JS ON VERCEL                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  /api/live-token     → mint ephemeral Gemini token     │  │
│  │  /api/chat           → text triage (web chat box)      │  │
│  │  /api/telegram       → bot webhook (separate adapter)  │  │
│  │  /api/alerts         → POST new alert / GET list       │  │
│  └────────────────────────────────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────▼─────────────────────────────────┐ │
│  │  SHARED TRIAGE ENGINE  (lib/triage/)                    │ │
│  │   • WHO danger-sign protocol state machine              │ │
│  │   • System prompt (same across all 3 channels)          │ │
│  │   • Severity scorer (GREEN / YELLOW / RED)              │ │
│  │   • Language detection + response shaping               │ │
│  │   • Clinic matcher (lat/lng → nearest partner)          │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────┬───────────────┬─────────────────┬─────────────────┘
           │               │                 │
           │               │                 │
   ┌───────▼──────┐ ┌──────▼────────┐ ┌──────▼──────────┐
   │  AI #1       │ │  AI #2        │ │  AI #3          │
   │  Gemini Live │ │  Gemini 2.5   │ │  Gemini 2.5     │
   │  Native      │ │  Flash        │ │  Flash-Lite     │
   │  Audio       │ │  (text)       │ │  (+ Flash for   │
   │  (web /call) │ │  (web /chat)  │ │   voice notes)  │
   │              │ │               │ │  (Telegram)     │
   └──────────────┘ └───────────────┘ └─────────────────┘
                            │
                  ┌─────────▼─────────┐
                  │  Supabase         │
                  │  (alerts +        │
                  │   clinics)        │
                  └───────────────────┘
```

**Key principle:** all three channels send their conversation through the **same triage engine** (system prompt, severity scorer, danger-sign codes). Only the *model* and *transport* differ per channel. This is what keeps GREEN/YELLOW/RED classifications consistent no matter where the user is talking to MaaSwara.

---

## 5. The Triage Engine (the heart of the project)

This is the part that actually saves lives, and the part judges will care about most. **Build this first.**

### 5.1 WHO antenatal danger signs (encoded)

| ID | Sign | Severity | Action |
|---|---|---|---|
| D1 | Vaginal bleeding | RED | Go to clinic NOW |
| D2 | Severe headache + blurred vision | RED | Suspect preeclampsia → clinic NOW |
| D3 | Convulsions / fits | RED | Emergency — clinic NOW |
| D4 | High fever (>38°C / 100.4°F) | RED | Clinic same day |
| D5 | Severe abdominal pain | RED | Clinic NOW |
| D6 | Reduced/absent fetal movement (<10/2hr after 28 weeks) | RED | Clinic same day |
| D7 | Swelling of face/hands | YELLOW→RED | Check BP — likely preeclampsia |
| D8 | Difficulty breathing | RED | Clinic NOW |
| D9 | Water breaking before 37 weeks | RED | Clinic NOW |
| D10 | Severe persistent vomiting | YELLOW | Clinic same day, hydrate |
| G1 | Mild nausea, fatigue, normal aches | GREEN | Reassure + general advice |

### 5.2 Triage state machine

```
┌─────────┐
│ GREETING│  "Hello sister, how are you feeling today?"
└────┬────┘
     ▼
┌─────────────┐
│ OPEN INTAKE │  Free-text/voice description
└────┬────────┘
     ▼
┌─────────────┐
│ SYMPTOM MAP │  Gemini extracts symptoms → maps to D1-D10/G1
└────┬────────┘
     ▼
┌─────────────────┐
│ FOLLOW-UP PROBE │  WHO-protocol clarifying questions
└────┬────────────┘  (e.g. "How many weeks pregnant are you?"
     ▼               "Is the bleeding heavy or spotting?")
┌──────────┐
│ CLASSIFY │  Output: { severity, signs[], confidence, language }
└────┬─────┘
     ▼
┌──────────┬──────────┬──────────┐
│  GREEN   │  YELLOW  │   RED    │
└────┬─────┴────┬─────┴────┬─────┘
     │          │          │
     │          │          ▼
     │          │   ┌───────────────┐
     │          │   │ CLINIC ALERT  │ ← write to Supabase
     │          │   │  + voice msg  │   → dashboard updates live
     │          │   └───────────────┘
     │          ▼
     │    "Schedule check-up
     │     within 24 hours"
     ▼
"You're doing well.
 Watch for X, Y, Z."
```

### 5.3 The system prompt (core of the engine)

Save this in `/lib/triage/system-prompt.ts`. This is the prompt for **both** the Live voice model and the text chat model.

```
You are MaaSwara, a warm, calm health companion for pregnant women.
You are NOT a doctor. You are a first-aid triage helper trained on WHO
antenatal danger-sign protocols.

CORE BEHAVIOR:
1. Detect the user's language from their first message. Reply in the
   SAME language. Supported: Hindi, Bhojpuri, English, Swahili, Yoruba,
   Hausa. If unsupported, fall back to English and apologize once.

2. Greet warmly. Use the second-person familiar register appropriate
   to the language (e.g. Hindi "tum/aap" — default to "aap" with elders).

3. Ask ONE question at a time. Never overwhelm.

4. Listen for any of these WHO danger signs:
   - Vaginal bleeding (any amount)
   - Severe headache with vision changes
   - Convulsions or fainting
   - Fever above 38°C
   - Severe abdominal pain
   - Reduced fetal movement (after 28 weeks)
   - Swelling of face or hands
   - Difficulty breathing
   - Water breaking before 37 weeks
   - Severe persistent vomiting

5. If you detect ANY of: bleeding, vision changes with headache,
   convulsions, severe pain, breathing difficulty, water breaking,
   reduced fetal movement → classify as RED. Tell her clearly and
   calmly: "Sister, this is serious. Please go to the nearest clinic
   right now. I am sending an alert to a clinic near you." Then
   emit the structured triage output.

6. For YELLOW signs, advise same-day check-up.

7. For GREEN (normal pregnancy discomfort), reassure and give one
   piece of practical advice (hydration, rest, nutrition).

8. NEVER diagnose. NEVER prescribe. NEVER give medication advice.
   When in doubt, escalate up (RED).

9. Always end RED responses with: "You are not alone. Help is coming."

STRUCTURED OUTPUT (after each meaningful turn, emit a JSON block):
```json
{
  "severity": "GREEN" | "YELLOW" | "RED",
  "signs_detected": ["D1", "D7", ...],
  "language": "hi" | "en" | "sw" | "yo" | "ha" | "bho",
  "weeks_pregnant": number | null,
  "needs_alert": boolean,
  "summary_en": "one-line English summary for clinic dashboard"
}
```

TONE:
Warm, dignified, never condescending. You are speaking to a woman
who is more capable than the world has given her credit for.
You are her sister, not her doctor.
```

### 5.4 Severity scorer (deterministic backup)

Don't trust the LLM alone. After each turn, run a **deterministic check**: if the conversation transcript contains any RED keyword in any supported language, force severity = RED. This is your safety net (Law #5: scope deeply, don't trust the model with safety-critical decisions alone).

```ts
// /lib/triage/severity-check.ts
const RED_KEYWORDS = {
  en: ['bleeding', 'blood', 'convulsion', 'seizure', 'cant breathe', 'water broke'],
  hi: ['खून', 'रक्तस्राव', 'दौरा', 'सांस नहीं'],
  sw: ['damu', 'kifafa', 'sipumui'],
  // ... extend
};
```

---

## 6. Conversation Flow Design

### 6.1 Sample flow — RED case (preeclampsia)

```
🤖 "Namaste behen, main MaaSwara hoon. Aaj aap kaisa
    mehsoos kar rahi hain?"
    (Hello sister, I'm MaaSwara. How are you feeling today?)

👩 "Mera sar bahut dard kar raha hai aur dikhayi nahi
    de raha theek se."
    (My head hurts a lot and I can't see properly.)

🤖 [Detects D2 — severe headache + vision changes]
    "Behen, yeh sun kar mujhe chinta hui. Aap kitne
     hafte ki garbhwati hain?"
    (Sister, I'm worried hearing this. How many weeks pregnant?)

👩 "Saat mahine."
    (Seven months.)

🤖 [D2 + 28+ weeks = high preeclampsia risk → RED]
    "Behen, yeh bahut zaroori hai. Aap abhi, isi waqt,
     paas ke clinic jaiye. Yeh garbhavastha mein khatre
     ka sanket hai. Main paas ke ek clinic ko aapke
     baare mein bata rahi hoon. Aap akeli nahi hain.
     Madad aa rahi hai."
    (Sister, this is very important. Please go to the nearest
     clinic right now. This is a danger sign in pregnancy. I'm
     telling a nearby clinic about you. You are not alone.
     Help is coming.)

    [Triggers alert → Supabase → Clinic dashboard updates live]
```

### 6.2 Sample flow — GREEN case

```
🤖 "Habari dada, mimi ni MaaSwara. Unajisikiaje leo?"

👩 "Nina kichefuchefu kidogo asubuhi."
    (I have a little nausea in the morning.)

🤖 [G1 — normal first-trimester nausea]
    "Hii ni jambo la kawaida sana mwanzoni mwa ujauzito.
     Jaribu kula vitafunio vidogo mara kwa mara, na
     kunywa maji mengi. Kama itazidi sana, nenda kwa
     daktari. Una wiki ngapi za ujauzito?"
```

### 6.3 Telegram-specific behavior

- On `/start` → bilingual greeting (English + auto-detect on first real message)
- Voice notes → transcribe with Gemini, then process as text
- After RED triage → bot offers `/share_location` button → location → matches nearest clinic → sends alert
- `/clinic` command → returns nearest 3 partner clinics
- `/lang hi` to force-set language

---

## 7. Frontend Design System

### 7.1 Brand

| Element | Value |
|---|---|
| Name | **MaaSwara** |
| Wordmark | "MaaSwara" — set in Fraunces 600, with the "Maa" in deep emerald and "Swara" in terracotta |
| Tagline | *A mother's voice, in her own voice.* |
| Mood | Warm, dignified, quiet, maternal — opposite of clinical |

### 7.2 Color tokens

```css
:root {
  /* Primary */
  --terracotta: #C2664E;       /* warmth, alertness */
  --terracotta-deep: #A04E37;
  --emerald: #1B4332;          /* trust, calm */
  --emerald-soft: #2D5F4C;

  /* Surfaces */
  --cream: #FAF3E7;            /* background */
  --cream-warm: #F5E9D4;
  --ivory: #FFFCF7;            /* cards */

  /* Accent */
  --gold: #D4A574;             /* highlights, alerts */
  --gold-soft: #E8C896;

  /* Semantic */
  --green: #4A7C59;            /* GREEN triage */
  --yellow: #D4A574;           /* YELLOW triage */
  --red: #B53737;              /* RED triage */

  /* Neutral */
  --ink: #2A1810;              /* text */
  --ink-soft: #5C443A;
  --line: #E8DCC8;
}
```

**Anti-AI-aesthetic note:** No purple gradients. No glassmorphism. No "futuristic" anything. This product's credibility comes from feeling *human, warm, traditional* — like something a grandmother could trust.

### 7.3 Typography

```
Display:   Fraunces (600, italic optional) — wordmark, big numbers
Headings:  Fraunces (500)
Body:      Inter (400, 500)
Mono:      JetBrains Mono (only on dashboard for IDs/timestamps)
```

Both fonts free on Google Fonts.

### 7.4 Screen-by-screen

#### Screen 1 — Patient landing (`/`)

```
┌──────────────────────────────────────────┐
│                                          │
│           [MaaSwara wordmark]            │
│   A mother's voice, in her own voice.    │
│                                          │
│   ┌─────────────────────────────────┐    │
│   │                                 │    │
│   │      [ 📞 Tap to call ]         │    │
│   │                                 │    │
│   │   Speak in your own language.   │    │
│   │   Hindi · Swahili · Yoruba ·    │    │
│   │   English · Bhojpuri · Hausa    │    │
│   │                                 │    │
│   └─────────────────────────────────┘    │
│                                          │
│   ──────────  or  ──────────             │
│                                          │
│   ┌─────────────────────────────────┐    │
│   │  💬  Type instead               │    │
│   └─────────────────────────────────┘    │
│                                          │
│   📲 Or message us on Telegram:          │
│      @MaaSwaraBot                        │
│                                          │
└──────────────────────────────────────────┘
```

Layout: phone-mockup-style, max-width 420px, centered. Cream background, terracotta CTA. Subtle warm gradient from cream → cream-warm at the bottom.

#### Screen 2 — Voice call active (`/call`)

A full-screen "in call" view:

```
┌──────────────────────────────────────────┐
│  ◀ End                                   │
│                                          │
│                                          │
│         [ pulsing emerald orb ]          │
│         (animates with audio level)      │
│                                          │
│                                          │
│           MaaSwara is listening          │
│                                          │
│                                          │
│   Live transcript (toggleable):          │
│   ┌──────────────────────────────────┐   │
│   │ 👩 "Mera sar dard kar raha hai"  │   │
│   │ 🤖 "Behen, kitne hafte ki..."     │   │
│   └──────────────────────────────────┘   │
│                                          │
│              [ 🎤 Mute ]                 │
└──────────────────────────────────────────┘
```

The orb is a key visual moment — use Framer Motion to scale it with `analyserNode.getByteFrequencyData()`.

#### Screen 3 — Text chat (`/chat`)

Standard messaging UI — but warmer. Cream bubble for bot (left, terracotta border), ivory bubble for user (right, emerald border). Fraunces 500 for messages because it feels like handwriting more than a tech product.

#### Screen 4 — Triage result modal

When severity = RED, surface a full-screen modal:

```
┌──────────────────────────────────────────┐
│            [terracotta banner]           │
│                                          │
│              ⚠ Important                 │
│                                          │
│       Please go to a clinic now          │
│                                          │
│   You may have signs of preeclampsia.    │
│   This needs a doctor today.             │
│                                          │
│   ┌─────────────────────────────────┐    │
│   │   📍 Nearest clinic:            │    │
│   │   Asha Maternity Center         │    │
│   │   12 km away                    │    │
│   │   They have been notified       │    │
│   └─────────────────────────────────┘    │
│                                          │
│       [ Open in Maps ]   [ Call ]        │
│                                          │
│        You are not alone.                │
│        Help is coming.                   │
└──────────────────────────────────────────┘
```

#### Screen 5 — Clinic dashboard (`/clinic`)

Grid layout. Each incoming alert is a card. Real-time updates via Supabase subscription. RED alerts pulse gently and stay at the top.

```
┌──────────────────────────────────────────────────────────┐
│  MaaSwara · Clinic Dashboard      Asha Maternity Center  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  🔴 ACTIVE  · 3 new alerts                               │
│                                                          │
│  ┌────────────────────┐ ┌────────────────────┐           │
│  │ 🔴 RED · 2 min ago │ │ 🟡 YELLOW · 8 min  │           │
│  │ Patient #4821      │ │ Patient #4820      │           │
│  │ 28w pregnant       │ │ 16w pregnant       │           │
│  │ Suspected          │ │ Persistent         │           │
│  │ preeclampsia       │ │ vomiting           │           │
│  │ 12 km · Bihar      │ │ 4 km · Patna       │           │
│  │ [View transcript]  │ │ [View transcript]  │           │
│  └────────────────────┘ └────────────────────┘           │
│                                                          │
│  Resolved today: 7                                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 7.5 Component inventory (what to build)

- `<Wordmark />`
- `<CallButton />` — big, terracotta, with subtle pulse
- `<VoiceOrb />` — Framer Motion animated SVG, reacts to audio level
- `<TranscriptStream />` — auto-scrolling transcript
- `<ChatBubble variant="bot" | "user" />`
- `<TriageBanner severity="green" | "yellow" | "red" />`
- `<AlertCard />` — clinic dashboard card
- `<LanguagePill />` — small language indicator
- `<ClinicMatch />` — nearest-clinic widget with map link
- `<EmptyDashboard />` — for clinic view when no alerts

---

## 8. Repository Structure

```
maaswara/
├── app/
│   ├── (patient)/
│   │   ├── page.tsx              # Landing
│   │   ├── call/page.tsx         # Voice call view
│   │   └── chat/page.tsx         # Text chat view
│   ├── clinic/
│   │   └── page.tsx              # NGO dashboard
│   ├── api/
│   │   ├── live-token/route.ts   # Mint Gemini Live ephemeral token
│   │   ├── chat/route.ts         # Text triage endpoint
│   │   ├── telegram/route.ts     # Telegram webhook
│   │   └── alerts/route.ts       # POST/GET alerts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn primitives
│   ├── Wordmark.tsx
│   ├── VoiceOrb.tsx
│   ├── ChatBubble.tsx
│   ├── TriageBanner.tsx
│   ├── AlertCard.tsx
│   └── ...
├── lib/
│   ├── triage/
│   │   ├── system-prompt.ts      # The prompt (§5.3)
│   │   ├── danger-signs.ts       # WHO codes & severity table
│   │   ├── severity-check.ts     # Deterministic backup scorer
│   │   ├── classify.ts           # Calls Gemini, returns structured output
│   │   └── clinic-match.ts       # lat/lng → nearest clinic
│   ├── gemini/
│   │   ├── live.ts               # AI #1 — Live API (web voice)
│   │   ├── chat.ts               # AI #2 — 2.5 Flash (web chat box)
│   │   └── telegram-model.ts     # AI #3 — 2.5 Flash-Lite + Flash for audio
│   ├── telegram/
│   │   ├── bot.ts                # grammy bot setup
│   │   ├── handlers.ts           # message + voice + command handlers
│   │   └── i18n-keyboard.ts      # language selection inline keyboard
│   ├── supabase/
│   │   ├── client.ts
│   │   └── schema.sql            # alerts + clinics tables
│   └── i18n/
│       └── messages/             # ui labels per language
├── public/
│   ├── og-image.png
│   └── favicon.ico
├── seed/
│   └── partner-clinics.json      # Synthetic NGO clinic data for demo
├── .env.example
├── README.md                     # See §11
├── DEPLOY.md                     # See §11
├── tests/
│   ├── triage.test.ts            # ← Don't skip these (Law #8)
│   └── severity-check.test.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

---

## 9. Roadmap (Phased Build)

You don't have a deadline — but you should still build in tight phases so each phase is portfolio-presentable on its own. Each phase ends with a deployed, working artifact.

### Phase 1 — Triage Engine + Text Chat (Days 1–3)
**Ship: working web text chat that triages correctly in 3+ languages.**

- Set up Next.js + Tailwind + shadcn
- Implement `/lib/triage/*` (system prompt, danger signs, severity check)
- Build `/api/chat` route using `gemini-2.5-flash`
- Build `/chat` page with bubble UI
- **Write tests** for triage classification (Law #8)
- Deploy to Vercel
- Test conversation in Hindi, English, Swahili

✅ **End of Phase 1:** A judge can open the URL and have a real triage conversation in their language.

### Phase 2 — Clinic Dashboard + Alerts (Days 4–5)
**Ship: real-time dashboard receiving alerts from chat.**

- Set up Supabase project, run schema, seed partner clinics
- Build `/api/alerts` POST/GET
- Build `/clinic` page with realtime subscription
- Wire chat to write alerts on RED triage
- Add nearest-clinic matcher (Haversine on lat/lng)

✅ **End of Phase 2:** Two browser tabs — chat in one, dashboard in the other. Triage RED, watch alert appear instantly in the dashboard.

### Phase 3 — Voice (Live API) (Days 6–8)
**Ship: voice call mode that talks to you.**

- Implement `/api/live-token` for ephemeral Gemini Live tokens
- Build `/call` page with WebSocket connection to Gemini Live
- Build `<VoiceOrb />` reactive to audio level
- Build live transcript stream
- Wire same triage system prompt into Live session

✅ **End of Phase 3:** Tap call, speak Hindi, get spoken response, trigger alert.

### Phase 4 — Telegram Bot (Days 9–10)
**Ship: working Telegram bot.**

- Create bot with `@BotFather`
- Implement `/api/telegram` webhook with `grammy`
- Wire to same triage engine
- Handle voice notes (download → Gemini → process)
- Add `/share_location`, `/clinic`, `/lang` commands
- Set webhook URL to Vercel

✅ **End of Phase 4:** Anyone can DM `@YourBotName` and triage works.

### Phase 5 — Polish + Demo Video (Days 11–12)
**Ship: 3-minute demo video for hackathon submission.**

- Final visual polish (animations, micro-interactions)
- README with deployment instructions for others
- Record demo video (script in §10)
- Submit

---

## 10. The 3-Minute Demo Script

This is the script for your YouTube submission video. Time markers are tight — practice it.

### 0:00 – 0:25 · Hook (the story)
> *Camera on you, warm tone.*
> "Every day, around 700 women die from preventable pregnancy complications. Almost all of them in places where the women most at risk can't read a health app, don't own a smartphone, and speak a dialect that no app supports.
>
> Their warning signs — preeclampsia, hemorrhage — are loud. The world just doesn't speak their language.
>
> This is MaaSwara."

### 0:25 – 0:35 · The product, in one line
> "MaaSwara is voice-first antenatal triage. A pregnant woman speaks in her own dialect, MaaSwara recognizes WHO danger signs in real time, and routes urgent cases to a partner-NGO clinic."

### 0:35 – 1:30 · Live voice demo (the moment)
> *Screen: web app open. You tap "Call".*
> *You speak in Hindi:* "Mera sar bahut dard kar raha hai aur kuch dikhayi nahi de raha."
> *MaaSwara responds in Hindi, asks how many weeks, you say "saat mahine," and it tells you — calmly, in Hindi — to go to a clinic now.*
> *Cut to clinic dashboard in another window — alert appears live.*

### 1:30 – 2:05 · Telegram demo (channel #2)
> "MaaSwara isn't tied to a website. Here's the same triage engine on Telegram — free, instant, works on any phone."
> *Switch to Telegram. Send a Swahili voice note. Bot replies in Swahili. Trigger an alert. Same dashboard updates.*

### 2:05 – 2:35 · Why this wins (judging criteria, in their language)
> "**Impact:** SDG 3.1 — direct line to maternal mortality reduction.
> **Innovation:** Voice-first triage in regional dialects — not another chatbot, not another dashboard. The literacy barrier is the barrier we solve.
> **Feasibility:** Built solo, free-tier, deployable in 10 minutes. Open source, MIT licensed.
> **Scalability:** Any of GNEC's 1,600 NGO subsidiaries can fork the repo and deploy in their region this week."

### 2:35 – 3:00 · Close
> "MaaSwara doesn't replace a doctor. It just makes sure a woman who needs one gets there in time. A mother's voice, in her own voice.
>
> Code, demo, and deployment guide are open and linked below."

---

## 11. README — Deployment Guide for Others

This is what goes in `README.md` so anyone can fork and deploy. **Critical:** the hackathon requires open source, AND you want NGOs to actually use this.

### README structure

```markdown
# MaaSwara

> A mother's voice, in her own voice.
> Voice-first antenatal danger-sign triage in regional dialects.

[ Live demo: maaswara.vercel.app ]
[ Telegram: @MaaSwaraBot ]
[ Clinic dashboard: maaswara.vercel.app/clinic ]

## What this is
[1 paragraph]

## Who it's for
[NGOs, community health programs, anyone working on maternal health
in low-literacy regions]

## Architecture
[Diagram — copy from §4]

---

## Quick start (5 minutes — your own deployed clone)

### Prerequisites
- Node.js 20+
- A free Google AI Studio API key — https://aistudio.google.com/apikey
- A free Supabase project — https://supabase.com
- A free Vercel account — https://vercel.com
- (Optional) A Telegram bot token from @BotFather

### Step 1 — Clone and install
```bash
git clone https://github.com/<your-username>/maaswara.git
cd maaswara
npm install
```

### Step 2 — Environment variables
Copy `.env.example` to `.env.local` and fill in:
```
GEMINI_API_KEY=...                   # From Google AI Studio
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
TELEGRAM_BOT_TOKEN=...               # Optional, only if using Telegram
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3 — Set up the database
In your Supabase SQL editor, paste the contents of `lib/supabase/schema.sql`
and run it. Then seed your clinics:
```bash
npm run seed:clinics
```

### Step 4 — Run locally
```bash
npm run dev
```
Open http://localhost:3000.

### Step 5 — Deploy to Vercel
Click the Deploy button below, or run:
```bash
vercel deploy
```
Set the same environment variables in your Vercel project settings.

[Deploy with Vercel button]

---

## Connecting Telegram (free, 2 minutes)

1. Open Telegram, search `@BotFather`, send `/newbot`, follow prompts
2. Copy the bot token, set it as `TELEGRAM_BOT_TOKEN` in Vercel
3. After deploying, register your webhook (one-time):
```bash
curl "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://<your-vercel-url>/api/telegram"
```
4. DM your bot. Done.

---

## Connecting WhatsApp (advanced — requires Meta Business)

This prototype does NOT ship with a WhatsApp adapter because Meta Business
verification takes days–weeks and is gated to verified organizations.
However, the triage engine is channel-agnostic, so adding WhatsApp is
straightforward if your organization already has Meta Business approval.

### Path A: WhatsApp Business Cloud API (free, Meta-direct)
1. Get Meta Business verification — https://business.facebook.com
2. Set up WhatsApp Business Cloud API — https://developers.facebook.com/docs/whatsapp/cloud-api
3. Create a webhook endpoint by copying `app/api/telegram/route.ts` to
   `app/api/whatsapp/route.ts` and replacing the message-send calls with
   WhatsApp Cloud API calls (template provided in `docs/whatsapp-adapter.md`)
4. Point your WhatsApp webhook at `https://<your-domain>/api/whatsapp`

### Path B: Twilio (paid — for IVR voice phone lines)
1. Sign up for Twilio, buy a phone number
2. Use `app/api/voice/route.ts` template (provided in `docs/twilio-adapter.md`)
3. Configure Twilio to forward calls to your endpoint

> The triage engine in `lib/triage/` does not change. Only the I/O adapter does.

---

## Adding new languages
Edit `lib/triage/system-prompt.ts` to list your language under "Supported".
Add UI strings to `lib/i18n/messages/<lang>.json`. That's it — Gemini handles
the actual conversation in the new language automatically.

## Adding partner clinics for your region
Edit `seed/partner-clinics.json`:
```json
{
  "name": "Your Clinic Name",
  "lat": 25.5941,
  "lng": 85.1376,
  "address": "...",
  "phone": "+91...",
  "languages": ["hi", "bho"]
}
```
Then re-run `npm run seed:clinics`.

---

## Important: synthetic data only
The repo ships with synthetic clinic data. Do NOT use real patient data
in this prototype without proper consent flows, data residency setup, and
clinical review. This is a triage *prototype*, not a certified medical device.

## License
MIT. Use it. Fork it. Deploy it. Save lives.
```

---

## 12. Submission Checklist

Pulled from the GNEC Hackathon rules so you don't miss anything:

- [ ] YouTube video, 5 min or less, **public**
- [ ] Project is open source under an OSI-approved license (MIT)
- [ ] Source code as ZIP **OR** link to public GitHub repo
- [ ] Project description references SDG 3 explicitly
- [ ] No prior work / no resubmission (this is a new repo)
- [ ] No advertising of established businesses
- [ ] Submitted before 3 May 2026 @ 9:30pm IST *(you said you're going past this for portfolio — fine, but if you DO submit, lock it in time)*

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Gemini Live free quota runs out mid-demo | Pre-record a 30-second backup voice clip; have text chat ready as fallback |
| Telegram webhook fails on Vercel cold start | Use Vercel's "always-on" by hitting the route once before demo; or use polling mode locally as backup |
| LLM misclassifies a RED case as GREEN | Deterministic keyword scorer in §5.4 forces RED on high-risk keywords |
| Judges don't speak Hindi/Swahili | Always have an English translation visible in transcript view |
| Supabase realtime hiccups during demo | Pre-seed 2 visible alerts so the dashboard never looks empty |

---

## 14. The Story for Judges (memorize this)

> "I built MaaSwara because every existing maternal health tool assumes the user can read. The women who need triage most are the ones who can't open a health app — but they can speak. So I built one that listens, in their language, and acts in seconds.
>
> The triage engine is open source. The Telegram bot works today, free, on any phone. The WhatsApp and IVR adapters are documented for any NGO with the resources to plug them in. GNEC's network of 1,600 subsidiaries could deploy this region by region, in their own languages, this month.
>
> A mother's voice, in her own voice."

---

**End of spec. Open this file in Antigravity, point the agent at §8 (repo structure) and §9 (roadmap), and start with Phase 1.**
