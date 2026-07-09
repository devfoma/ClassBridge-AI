# ClassBridge AI — Technical Design Document (TDD)

**Version:** 0.1.0 (MVP)
**Status:** Draft
**Last updated:** 2026-07-09

> A Gemma-powered, offline-first mobile classroom for low-connectivity schools. A teacher
> runs a full digital classroom on a school laptop over local Wi‑Fi / a phone hotspot with
> no internet. A local **hub** (Node + Express + SQLite) uses **Google Gemma** (via
> **Ollama**) to turn a lesson note into a summary and a quiz. Students join with a class
> code, download lessons, go fully offline, take the quiz, and sync answers back.

---

## 1. Purpose & scope

This document describes the architecture and technical design of ClassBridge AI. It is the
reference for how the system is structured, why the key decisions were made, and where the
boundaries lie. It complements the operational instructions in [`README.md`](README.md)
(setup, demo script, troubleshooting); this document focuses on *design*, not *how-to-run*.

### 1.1 Goals

- Deliver **one complete, reliable lesson flow** end‑to‑end: create class → import lesson →
  AI summary + quiz → publish → student downloads → offline quiz → sync → graded feedback.
- Work **fully offline on the student device** after an initial download over the LAN.
- Keep **all data on the local school network** — no cloud, no accounts, no student data
  leaving the device or the hub.
- Degrade gracefully when the AI model is unavailable (deterministic mock fallback).

### 1.2 Non-goals (MVP)

- Full user authentication / identity management (a class code + device id is the identity).
- Cloud sync, multi-hub federation, or advanced conflict resolution.
- Non-text resources (PDF/video extraction) — text `.txt` lessons only for now.
- Running the LLM on the phone (Gemma is hosted on the hub laptop).

---

## 2. System architecture

Two deployable units on one LAN, communicating over REST/HTTP:

```
 ┌──────────────────────────────┐        ┌───────────────────────────────────┐
 │  Mobile app (React Native +  │  REST  │   Local Hub (teacher laptop)      │
 │  Expo Router, TypeScript)    │◄──────►│   Node + Express + SQLite         │
 │                              │ Wi-Fi/ │                                   │
 │  Teacher Mode / Student Mode │ hotspot│   SQLite (source of truth)        │
 │  expo-sqlite (local cache)   │  / LAN │   Gemma via Ollama (+ mock)       │
 │  expo-file-system (lessons)  │        │   Local file storage (/storage)   │
 └──────────────────────────────┘        └───────────────────────────────────┘

 Source of truth (hub):    classrooms, resources, assignments, submissions, feedback, insights
 Owned by device (mobile): local drafts, offline quiz answers, unsynced submissions
```

**Design principle — split ownership:** The hub is the single source of truth for everything
except in-flight student work; the device exclusively owns submissions until they sync. This
makes the sync model trivial (see §8): there is nothing to merge.

**Why Gemma runs on the hub, not the phone:** Gemma is too heavy for a low-end phone. The
laptop hosts Ollama + Gemma; phones talk to it over the LAN. Students still work fully offline
because lessons and quizzes are downloaded to the device before going offline.

---

## 3. Technology stack

| Layer | Choice | Notes |
|---|---|---|
| Hub runtime | Node.js 18+ (dev on 24), TypeScript | Express 4, `cors`, JSON body limit 10mb |
| Hub DB | SQLite via Node's built-in `node:sqlite` | Adapter `hub/src/sqlite.ts` gives a `better-sqlite3`-compatible API, avoiding native builds |
| AI | Google Gemma via Ollama `POST /api/generate` | Deterministic mock provider as fallback |
| Validation | `zod` + `safeJson` JSON repair | Hardens against malformed LLM output |
| Mobile | React Native 0.81.5, React 19.1.0, Expo SDK 54 | Expo Router (file-based navigation) |
| Mobile DB | `expo-sqlite` | Local cache + offline queue |
| Mobile files | `expo-file-system` (v19 File/Directory API) | Lesson text/binaries stored on device |
| Mobile state | `zustand` | Auth, classroom, hub, sync stores |
| Mobile forms | `react-hook-form` | |
| Testing | Jest (+ supertest on the hub) | See §12 |

---

## 4. Component design

### 4.1 Hub (`hub/src/`)

Layered: **routes → services → db**. Routes validate input and shape HTTP responses;
services hold business logic; a thin `db.ts` wraps the SQLite adapter.

- **`app.ts`** — builds the Express app: CORS, JSON parsing, mounts all routers, a 404
  handler, and a central error handler that maps `HttpError` to status codes and never leaks
  stack traces to clients.
- **`config.ts`** — environment-driven config (port, DB path, Gemma provider/model/timeout,
  mock-fallback flag). Defaults: port `4000`, provider `ollama`, model `gemma4`, timeout 60s,
  `allowMockFallback=true`.
- **`routes/`** — `health`, `users`, `classrooms`, `resources`, `gemma`, `assignments`,
  `submissions`, `sync`, `insights`.
- **`services/`** — `classroom`, `resource`, `pack`, `assignment`, `submission`, `sync`,
  `gemma`, `gemmaMock`, `grading`, `insight`, `jsonRepair`.
- **`prompts/`** — prompt builders: `summarizeResource`, `generateQuiz`, `gradeAnswer`,
  `classInsight`, `tutorHint`.
- **`schema.ts` / `db.ts`** — schema DDL and DB access. `seed.ts`, `reset.ts`, `index.ts`
  are lifecycle scripts.
- **`storage/`** — on-disk `packs/` and `resources/` file storage.

### 4.2 Mobile (`mobile/`)

- **`app/`** — Expo Router screens. `index.tsx` is role selection; `teacher/` and `student/`
  are separate screen stacks with their own `_layout.tsx`.
  - *Teacher:* dashboard, classrooms, classroom-detail, library, upload-resource,
    assignment-create, submissions, insights, settings.
  - *Student:* dashboard, join-class, lessons, lesson-detail, quiz, sync, feedback, settings.
- **`src/db/`** — `mobileDb.ts` (expo-sqlite handle), `schema.ts`, `migrations.ts`, and
  `repositories/` (localUser, classroom, resource, assignment, submission, sync).
- **`src/services/`** — `apiClient` (hub REST client), `authService`, `networkService`,
  `resourceDownloadService`, `fileService` (device file storage), `quizScoring`,
  `submissionStatus` (offline lifecycle state machine), `syncService`.
- **`src/state/`** — zustand stores: `useAuthStore`, `useClassroomStore`, `useHubStore`,
  `useSyncStore`.
- **`src/components/`, `src/theme/`, `src/types/`, `src/utils/`** — shared UI, theming,
  types, and helpers (`safeJson`, `dates`, `ids`).

---

## 5. Data model

All timestamps are ISO-8601 strings; all ids are string keys.

### 5.1 Hub SQLite (source of truth) — `hub/src/schema.ts`

| Table | Key columns | Purpose |
|---|---|---|
| `users` | id, name, role, device_id, created_at | Teachers and students |
| `classrooms` | id, name, teacher_id, **class_code UNIQUE**, created_at | Classes |
| `classroom_members` | id, classroom_id, student_id, joined_at | Enrolment |
| `resources` | id, title, type, file_path, text_content, subject, level, **summary**, metadata_json | Lessons + AI summary |
| `assignments` | id, classroom_id, title, instructions, resource_ids_json, **quiz_json**, published_at | Quiz assignments |
| `submissions` | id, assignment_id, student_id, answers_json, score, max_score, **feedback_json**, submitted_at, synced_at | Graded student work |
| `sync_events` | id, device_id, entity_type, entity_id, operation, payload_json | Sync audit log |

Indexes on `classroom_members(classroom_id)`, `assignments(classroom_id)`,
`submissions(assignment_id)`, `submissions(student_id)`.

### 5.2 Mobile SQLite (local cache/queue) — `mobile/src/db/schema.ts`

| Table | Purpose |
|---|---|
| `local_user` | This device's identity + `hub_url` |
| `local_classrooms` | Joined classes, `last_synced_at` |
| `local_resources` | Downloaded lessons: `local_path`, `remote_path`, `downloaded` flag, `text_content` |
| `local_assignments` | Downloaded quizzes (`quiz_json`), `downloaded_at` |
| `local_submissions` | Offline answers + lifecycle `status`, score/feedback once synced |
| `local_meta` | Key/value app metadata |

### 5.3 Core domain types

- **Quiz** = `{ questions: QuizQuestion[] }`, where `QuizQuestion` =
  `{ id, type: 'multiple_choice' | 'short_answer', question, options[], answer, marks }`.
- **ResourceSummary** = `{ title, subject, level, topics[], summary, prerequisites[], suggestedActivity }`.
- **GradeResult** = `{ score, maxScore, feedback, misconception }`.

---

## 6. API surface (hub REST)

Base: `http://<hub-lan-ip>:4000`. Errors return `{ error: { message, details? } }`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness (name, version, time) |
| GET | `/health/gemma` | Gemma provider reachability |
| POST | `/users/upsert` | Create/update a user (device identity) |
| POST | `/classrooms` | Create a classroom |
| GET | `/classrooms` | List classrooms |
| GET | `/classrooms/by-code/:classCode` | Look up class by join code |
| POST | `/classrooms/join` | Student joins with class code |
| GET | `/classrooms/:id` | Classroom detail |
| POST | `/resources/upload` | Upload a resource (text/file) |
| POST | `/resources/import-pack` | Import a sample lesson pack |
| GET | `/resources` · `/resources/:id` · `/resources/:id/download` | List / detail / download |
| POST | `/gemma/summarize` | Generate a resource summary |
| POST | `/gemma/generate-quiz` | Generate a quiz from a resource |
| POST | `/gemma/grade-answer` | Grade a short answer |
| POST | `/assignments` · GET `/assignments` · GET `/assignments/:id` | Create / list / detail |
| POST | `/assignments/:id/publish` | Publish (sets `published_at`) |
| GET | `/submissions` | List submissions (teacher dashboard) |
| GET | `/sync/pull` | Device pulls classrooms/assignments/resources |
| POST | `/sync/push` | Device pushes submissions (grades on arrival) |
| GET | `/insights/classroom/:classroomId` | AI class insight |

---

## 7. Key flows

### 7.1 AI content generation (teacher, online)
1. Teacher imports a lesson (`/resources/import-pack` or `/resources/upload`).
2. `/gemma/summarize` → hub builds a prompt, calls Gemma, repairs/validates JSON, stores
   `resources.summary`.
3. `/gemma/generate-quiz` → produces a `Quiz`; stored on the assignment as `quiz_json`.
4. Teacher reviews ("Teacher Review Required") and calls `/assignments/:id/publish`.

### 7.2 Offline student flow
1. Student joins (`/classrooms/join`) and pulls (`/sync/pull`) while on the LAN.
2. Lessons/quizzes are written to `local_resources` / `local_assignments`; lesson text/files
   are saved to device storage via `fileService` (expo-file-system `File`/`Directory`).
3. Device goes offline. Student reads the lesson and takes the quiz entirely from local data.
4. Multiple-choice is scored locally (`quizScoring`); short answers are flagged for hub grading.
5. Submission is saved to `local_submissions` with status `completed_unsynced` ("Saved Offline").

### 7.3 Sync + grading
1. On reconnect, `syncService` calls `/sync/push` with unsynced submissions.
2. Hub persists the submission, runs `grading.service` (Gemma or mock) for short answers,
   stores `score` / `max_score` / `feedback_json`, and returns the graded result.
3. Device updates the local submission to `synced` and shows feedback.
4. Teacher sees scores on `/submissions` and a class insight via `/insights/classroom/:id`.

---

## 8. Sync & conflict model

**Deliberately trivial.** Ownership is split so writes never collide:

- The **hub** writes classrooms, resources, assignments, feedback, insights.
- The **device** writes only submissions.

Therefore `/sync/pull` (hub → device) and `/sync/push` (device → hub) never contend for the
same record and there is **nothing to merge**. `sync_events` records an audit trail of device
pushes. This is a conscious MVP simplification (see §14).

### 8.1 Submission lifecycle (device) — `submissionStatus.ts`

A small state machine guards transitions:

```
draft → completed_unsynced → syncing → synced
                              syncing → sync_failed → syncing (retry)
                                        sync_failed → completed_unsynced
```

Labels shown in-app: `Draft`, `Saved Offline`, `Syncing…`, `Synced`, `Sync Failed`.
Invalid transitions throw, keeping the offline queue in a well-defined state.

---

## 9. AI / Gemma integration

- **Provider abstraction:** `gemma.service.ts` (real) and `gemmaMock.service.ts`
  (deterministic) behind one interface, selected by `GEMMA_PROVIDER`.
- **Ollama call:** `POST {OLLAMA_BASE_URL}/generate` with
  `{ model, prompt, stream: false }`, reading `data.response`.
- **Prompting:** dedicated builders in `prompts/` per task (summarize, quiz, grade, insight,
  tutor hint) keep prompt text out of business logic.
- **Robust JSON handling:** LLMs emit messy output, so responses go through `safeJson` /
  `jsonRepair` (strips code fences, repairs partial JSON) and then **zod** validation against
  the expected shape, with deterministic fallbacks. The app never crashes on bad AI output;
  worst case is a fallback quiz/summary.
- **Fallback policy:** with `GEMMA_ALLOW_MOCK_FALLBACK=true` (default), an unreachable Ollama
  logs a warning and transparently uses the mock so a demo never dead-ends. The mock is
  clearly marked in logs/responses and never silently replaces a working real model.

> **Config caveat:** the default model name in code is `gemma4`; set `OLLAMA_MODEL` to match
> exactly what `ollama list` shows or real Gemma calls fail (then fall back to mock).

---

## 10. Offline-first design

- Everything a student needs for a lesson (text, quiz JSON) is downloaded to `expo-sqlite` +
  `expo-file-system` before going offline.
- MC grading is fully local; only short-answer grading and insights require the hub.
- The submission state machine + `local_submissions` act as a durable offline queue that
  survives app restarts and drains on reconnect.
- `networkService` detects connectivity (`@react-native-community/netinfo`) to drive sync.

---

## 11. Security & privacy

- **Data locality:** all data stays on the hub and devices on the local network; no cloud,
  no external accounts, no student data leaving the LAN.
- **Identity model (MVP):** class code + device id — intentionally lightweight, not full auth
  (see §14). Suitable for a trusted single-classroom LAN.
- **Transport:** cleartext HTTP over the LAN (enabled via `app.json`
  `usesCleartextTraffic`), because there is no internet and no PKI in the target environment.
- **Error hygiene:** the hub's central error handler returns structured messages and never
  leaks stack traces to clients.

---

## 12. Testing strategy

- **Hub (Jest + supertest, in-memory SQLite, mock provider):** health, classroom
  create/join, pack import, mock Gemma summary/quiz JSON, malformed-JSON repair/validation,
  assignment publish + student pull, push sync creating a graded submission, grading stores
  score/feedback, insights endpoint. Files in `hub/src/tests/`.
- **Mobile (Jest, pure functions):** `safeJson`, quiz scoring, submission status machine
  (`mobile/src/__tests__/pure.test.ts`).
- **Type checks:** `npm run typecheck` (hub + mobile).
- **Manual demo matrix:** offline lesson access, sync after reconnect, Gemma quiz generation,
  Gemma feedback (documented in README).

Commands: `npm test` (hub), `npm run test --prefix mobile`, `npm run typecheck`.

---

## 13. Runtime & deployment

- **Monorepo** with npm workspaces (`hub`, `mobile`); root `overrides` pin `react`/`react-dom`
  to `19.1.0`.
- **Hub:** `npm run seed` (demo teacher/class/pack) then `npm run dev:hub` → listens on
  `:4000` and prints its LAN IP. `build:hub`, `start:hub`, `reset:hub` for lifecycle.
- **Mobile:** `npm run dev:mobile` (`expo start`); run in Expo Go or an emulator on the same
  network. Android emulator → hub at `http://10.0.2.2:4000`.
- **LAN:** phone and laptop on the same Wi‑Fi/hotspot; set Hub URL to the laptop's LAN IP.

---

## 14. Known limitations & future work

| Area | MVP state | Future |
|---|---|---|
| Auth | Class code + device id | Real teacher/student authentication |
| Resources | `.txt` text only | PDF/video extraction |
| Hub URL | Manual entry (QR payload `{ hubUrl, classCode }` shown) | QR-first onboarding |
| Tutor hint | Online-only, optional | Broader on-device assistance |
| Sync | Single-writer split, no merge | Conflict resolution, multi-device drafts |
| SQLite (hub) | Node built-in engine via adapter | Optional `better-sqlite3` when native tooling exists |
| Architecture | Old RN architecture (`newArchEnabled: false`) | New Architecture before Expo SDK 55 |

---

*Built for a hackathon: prioritising one complete, reliable lesson flow end-to-end.*
