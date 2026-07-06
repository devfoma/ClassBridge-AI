# ClassBridge AI

**A Gemma-powered offline mobile classroom for low-connectivity schools.**

ClassBridge AI lets a teacher run a full digital classroom on a school laptop over
local Wi‑Fi / a phone hotspot — no internet required. A local **hub** (Node + Express +
SQLite) uses **Google's Gemma** (via **Ollama**) to turn a lesson note into a summary
and a quiz. Students join with a class code, **download lessons, go fully offline,
take the quiz, and sync** their answers back when they return to the hub. The teacher
then sees scores, AI feedback and a class insight.

> Everything stays on the local school network. No cloud, no accounts, no student data
> leaving the device or the hub.

---

## Table of contents

- [The demo flow](#the-demo-flow)
- [Architecture](#architecture)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Install](#install)
- [Run the hub](#run-the-hub)
- [Gemma / Ollama setup](#gemma--ollama-setup)
- [Mock Gemma (no Ollama needed)](#mock-gemma-no-ollama-needed)
- [Run the mobile app](#run-the-mobile-app)
- [LAN setup (phone ↔ hub)](#lan-setup-phone--hub)
- [Exact demo script](#exact-demo-script)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Known MVP limitations](#known-mvp-limitations)

---

## The demo flow

```
Teacher creates class
  → imports the Photosynthesis lesson
  → Gemma generates a summary
  → Gemma generates a quiz
  → teacher reviews & publishes the assignment
Student joins the class with the class code
  → downloads the lesson while connected to the hub
  → goes OFFLINE, reads the lesson, completes the quiz, saves locally
  → reconnects to the same Wi‑Fi and syncs the submission
Teacher dashboard shows the score, AI feedback and a class insight
```

---

## Architecture

```
        ┌─────────────────────────────┐         ┌──────────────────────────────────┐
        │   Mobile app (React Native  │  REST   │   Local Hub (teacher laptop)     │
        │   + Expo Router, TypeScript)│ ◄─────► │   Node + Express + SQLite        │
        │                             │  Wi‑Fi/ │                                  │
        │  ┌───────────┐ ┌──────────┐ │  hotspot│   ┌─────────┐   ┌─────────────┐  │
        │  │ Teacher   │ │ Student  │ │  / LAN  │   │ SQLite  │   │ Gemma via   │  │
        │  │ Mode      │ │ Mode     │ │         │   │ (better │   │ Ollama      │  │
        │  └───────────┘ └──────────┘ │         │   │ -sqlite │   │ /api/gen…   │  │
        │  expo-sqlite (local cache)  │         │   │  compat)│   │ + mock      │  │
        │  expo-file-system (lessons) │         │   └─────────┘   │ fallback    │  │
        └─────────────────────────────┘         │                 └─────────────┘  │
                                                 │   local file storage /storage    │
                                                 └──────────────────────────────────┘

Source of truth:  hub  → classrooms, resources, assignments, quizzes, feedback, insights
Owned by device:  mobile → local drafts, offline quiz answers, unsynced submissions
```

**Why Gemma runs on the hub, not the phone:** Gemma is too heavy for a low‑end phone.
The laptop hosts Ollama + Gemma; phones talk to it over the LAN. Students still work
**fully offline** because lessons and quizzes are downloaded to the device first.

**Sync conflict rules are deliberately simple:** the hub only writes
classrooms/assignments/feedback; the student device only writes submissions. There is
nothing to merge.

---

## Repository layout

```
classbridge-ai/
  hub/            Node + Express + SQLite + Gemma backend (TypeScript)
    src/
      routes/     health, users, classrooms, resources, assignments,
                  submissions, sync, gemma, insights
      services/   classroom, resource, pack, assignment, submission, sync,
                  gemma, gemmaMock, grading, insight, jsonRepair
      prompts/    summarizeResource, generateQuiz, gradeAnswer, classInsight, tutorHint
      tests/      health, classrooms, gemma-json, submissions, sync  (jest + supertest)
  mobile/         React Native + Expo Router app (TypeScript)
    app/          role selection + teacher/ and student/ screen stacks
    src/          components, db (expo-sqlite) + repositories, services, state (zustand), theme
  sample-packs/   photosynthesis-pack, math-fractions-pack (small .txt lessons)
```

---

## Prerequisites

- **Node.js 18+** (developed on Node 24). `node --version`
- **npm** (comes with Node).
- **A phone with Expo Go**, or an Android/iOS emulator, on the **same network** as the laptop.
- **Optional (for real AI):** [Ollama](https://ollama.com) + a Gemma model. Without it,
  the deterministic **mock provider** keeps the whole demo working.

> **SQLite note:** the hub uses **Node's built‑in `node:sqlite`** engine through a tiny
> better-sqlite3‑compatible adapter (`hub/src/sqlite.ts`). This is the one small
> environment adjustment from the spec — it avoids the native `better-sqlite3` build,
> which needs Visual Studio C++ tools, so the hub runs anywhere Node runs.

---

## Install

From the repo root:

```bash
npm run install:all       # installs root, hub and mobile deps
```

Or individually:

```bash
npm install --prefix hub
npm install --prefix mobile
```

---

## Run the hub

```bash
cp hub/.env.example hub/.env      # optional; sensible defaults exist
npm run seed                      # creates a demo teacher, class and the Photosynthesis pack
npm run dev:hub                   # starts the hub on http://localhost:4000
```

You'll see output like:

```
  ClassBridge Local Hub v0.1.0
  Gemma provider: ollama (model: gemma4)
  Listening on http://localhost:4000
  On your LAN:    http://192.168.1.5:4000   <- use this as the Hub URL on phones
```

Check it:

```bash
curl http://localhost:4000/health
# {"status":"ok","hubName":"ClassBridge Local Hub","version":"0.1.0","time":"..."}
```

Other hub scripts: `npm run build:hub`, `npm run start:hub`, `npm run reset:hub` (wipes the DB).

---

## Gemma / Ollama setup

1. Install Ollama: https://ollama.com/download
2. Pull a Gemma model and note its exact name:
   ```bash
   ollama pull gemma:2b        # small & fast, good for demos
   # or: ollama pull gemma2    # if available on your machine
   ollama list                 # shows the exact model name
   ```
3. Point the hub at it in `hub/.env`:
   ```env
   GEMMA_PROVIDER=ollama
   OLLAMA_BASE_URL=http://localhost:11434/api
   OLLAMA_MODEL=gemma:2b       # must match `ollama list`
   ```
   The hub calls `POST http://localhost:11434/api/generate` with
   `{ "model": OLLAMA_MODEL, "prompt": "...", "stream": false }` and reads `data.response`.
4. Restart the hub. The teacher's **Generate with Gemma** buttons now use the real model.

> The default model name in code is `gemma4`. **Change `OLLAMA_MODEL` to whatever
> `ollama list` shows** — otherwise Gemma calls fail and (by default) fall back to mock.

---

## Mock Gemma (no Ollama needed)

The hub ships a **deterministic mock provider** so you can demo everything without Ollama:

```env
GEMMA_PROVIDER=mock
```

Or leave `GEMMA_PROVIDER=ollama` and keep `GEMMA_ALLOW_MOCK_FALLBACK=true` (the default):
if Ollama is unreachable, the hub logs a warning and **automatically falls back to mock**
so the demo never dead‑ends. The mock is clearly marked in logs/responses and never
replaces the real Gemma path — it just guarantees a reliable hackathon demo.

---

## Run the mobile app

```bash
npm run dev:mobile        # = expo start
```

- Press `a` for an Android emulator, `i` for iOS simulator, or scan the QR with **Expo Go**.
- First screen = **role selection**. Pick **Teacher** or **Student**.
- Open **Settings** and set the **Hub URL** (see LAN setup below), then **Test Hub Connection**.

To demo teacher and student on one machine, either use two devices/emulators, or in the
app go to **Settings → Switch Role / Reset** to flip roles on the same device.

---

## LAN setup (phone ↔ hub)

1. Find the laptop's local IP:
   - **Windows:** `ipconfig` → look for `IPv4 Address` (e.g. `192.168.1.5`)
   - **macOS/Linux:** `ifconfig` or `ip addr` (e.g. `192.168.1.5`)
   - The hub also prints it on startup.
2. On the phone, set **Hub URL** to `http://<laptop-ip>:4000`, e.g. `http://192.168.1.5:4000`.
3. Keep the **phone and laptop on the same Wi‑Fi or hotspot**. A phone hotspot that the
   laptop joins works great in schools with no internet.
4. Android emulator talking to a hub on the same machine: use `http://10.0.2.2:4000`.

---

## Exact demo script

1. **Start Ollama** (or set `GEMMA_PROVIDER=mock` to skip): `ollama serve` is usually automatic.
2. **Pull/run the Gemma model:** `ollama pull gemma:2b` and set `OLLAMA_MODEL` to match.
3. **Start the hub:** `npm run seed` then `npm run dev:hub`.
4. **Start the app:** `npm run dev:mobile`, open in Expo Go / emulator.
5. **Choose Teacher Mode.** In **Settings**, set the Hub URL and tap **Test Hub Connection**.
6. **Create a classroom** (Classrooms → Create). Note the **class code** (e.g. `JSS2‑4821`).
7. **Import the Photosynthesis pack** (Library → Import Photosynthesis Pack).
8. **Generate a summary** (Library → Summarize on the resource).
9. **Generate a quiz** (Library → *Make Quiz & Assign*, or Create Assignment → Generate with Gemma).
10. **Publish the assignment** after reviewing the AI questions (*Teacher Review Required*).
11. **Choose Student Mode** on another device/emulator, or **Switch Role / Reset** on the same one.
12. **Join the class** with the class code + hub URL (Student → Join Class).
13. **Pull/download the assignment** (happens on join; also via My Lessons → Download New Lessons).
14. **Simulate offline:** turn on airplane mode / turn off Wi‑Fi. Open **My Lessons → the lesson**.
15. **Complete the quiz** and tap **Submit Offline** → status becomes **Saved Offline**.
16. **Reconnect** to the hub's Wi‑Fi/hotspot.
17. **Sync** (Sync Center → Sync Now). The hub grades with Gemma (or mock) and returns feedback.
18. **Teacher sees the score & AI insight** (Submissions, and AI Insights → Generate with Gemma).

---

## Testing

Hub tests (jest + supertest, run against an in‑memory SQLite with the mock provider):

```bash
npm run test          # from repo root (runs hub tests)
# or
npm run test --prefix hub
```

Covers: health, classroom create/join, pack import, mock Gemma summary/quiz JSON,
malformed‑JSON repair/validation, assignment publish + student pull, push sync creating a
graded submission, grading stores score/feedback, and the insights endpoint.

Mobile unit tests (pure functions — safeJson, quiz scoring, submission status machine):

```bash
npm run test --prefix mobile
```

Type checks:

```bash
npm run typecheck     # hub + mobile
```

**Manual demo tests**

| Scenario | Steps | Expected |
|---|---|---|
| Offline lesson access | Download lesson, enable airplane mode, open lesson | Lesson text + quiz open with no network |
| Sync after reconnect | Submit quiz offline, reconnect, Sync Now | Submission appears on the teacher dashboard |
| Gemma quiz generation | Import a note, tap Generate with Gemma | Structured quiz questions returned |
| Gemma feedback | Student submits a short answer, hub grades on sync | Teacher sees score, feedback and misconception |

---

## Troubleshooting

- **Ollama unavailable / Gemma 503:** ensure `ollama serve` is running and `OLLAMA_MODEL`
  matches `ollama list`. For demos, set `GEMMA_PROVIDER=mock` or keep
  `GEMMA_ALLOW_MOCK_FALLBACK=true` so the hub auto‑falls back.
- **Malformed Gemma JSON:** handled automatically — `safeJson` repairs fenced/partial JSON,
  zod validates the shape, and there are deterministic fallbacks. The app never crashes on
  bad AI output; you may just see a fallback quiz/summary.
- **Phone cannot reach the hub:** confirm same Wi‑Fi/hotspot, use the laptop's LAN IP
  (`http://192.168.1.5:4000`, not `localhost`), and allow Node through the OS firewall.
  Android emulator → `http://10.0.2.2:4000`.
- **Expo networking issues:** the app uses cleartext HTTP to the LAN hub (enabled in
  `app.json`). If Expo Go can't connect, restart with `npx expo start -c`.
- **Reset SQLite (hub):** `npm run reset:hub` wipes the hub DB; `npm run seed` reseeds.
- **Reset local device data:** app → **Settings → Clear Local Data** or **Switch Role / Reset**.

---

## Known MVP limitations

- No full authentication — a class code + device id is the identity model.
- Manual hub URL (a QR payload with `{ hubUrl, classCode }` is shown for the teacher; manual
  entry is the primary path).
- Text‑first resource extraction — `.txt` lessons work today; **PDF/video are planned**.
- The AI tutor hint is optional and only works while connected to the hub.
- Simple sync model (student writes submissions, hub writes everything else) — no advanced
  conflict resolution.
- SQLite on the hub uses Node's built‑in engine via a compatibility adapter (see Prerequisites).

---

Built for a hackathon: prioritising **one complete, reliable lesson flow** end‑to‑end.
