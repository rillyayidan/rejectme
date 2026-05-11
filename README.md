# RejectMe

RejectMe is a CV review app that gives brutally specific, role-aware feedback through AI HR personas. Users can upload a CV PDF or paste CV text, choose a target role, pick an HR persona, then get a streaming roast, survival score, structured critique items, and rewrite suggestions.

Built for `GDG JuaraVibeCoding / Live Build`.

## Features

- PDF upload with browser-side text parsing.
- Manual CV text editor for pasted or cleaned CV content.
- Target role and optional target company context.
- HR persona picker:
  - `Pak Hendra` for BUMN / formal recruitment standards.
  - `Kak Rara` for startup / impact-driven hiring standards.
  - `Bu Diana` for corporate / ATS and professional standards.
- Streaming AI roast from Vertex AI Gemini.
- Survival Score with ATS, role match, clarity, impact, and red-flag breakdown.
- Structured critique items with severity, category, quoted CV text, and actionable suggestions.
- "Fix This" rewrite flow for weak CV bullets.
- Google login with Firebase Auth.
- Firestore session history under `users/{uid}/sessions`.
- Firebase Admin health check endpoint.

## Tech Stack

- Next.js `16.2.6` with App Router
- React `19.2.4`
- TypeScript
- Tailwind CSS 4
- shadcn/Radix UI components
- Firebase Auth, Firestore, Storage, and Firebase Admin
- Google Cloud Vertex AI Gemini
- PDF.js via `pdfjs-dist`

## Requirements

- Node.js `20.9` or newer
- npm
- Firebase project with Google Auth enabled
- Firestore database
- Google Cloud project with Vertex AI access
- Service account credentials for Firebase Admin

## Environment Variables

Create `.env.local` in the project root. Do not commit this file.

```env
GOOGLE_CLOUD_PROJECT=your-google-cloud-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GEMINI_MODEL=gemini-2.5-flash

NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-web-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Notes:

- `NEXT_PUBLIC_*` values are used by the browser Firebase client.
- `FIREBASE_*` service account values are used only by Firebase Admin on the server.
- `FIREBASE_PRIVATE_KEY` can use escaped `\n` line breaks.
- `GEMINI_MODEL` is optional. The app defaults to `gemini-2.5-flash`.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

To use the main roast flow, login with Google, upload or paste a CV, fill the target role, pick a persona, then run the review.

## Scripts

```bash
npm run dev      # start local development server
npm run build    # create production build
npm run start    # run production server after build
npm run lint     # run ESLint
```

## API Routes

- `POST /api/roast` - streams persona-based CV feedback.
- `POST /api/score` - calculates Survival Score.
- `POST /api/structured-roast` - returns structured critique data.
- `POST /api/fix` - rewrites one weak CV bullet.
- `GET /api/firebase-health` - checks Firebase Admin connectivity.

All AI endpoints expect CV text, a valid persona id (`bumn`, `startup`, or `corporate`), and a target role. The roast and structured roast endpoints also accept an optional target company.

## Project Structure

```txt
app/                  Next.js pages, layout, and API route handlers
components/           UI and feature components
components/cv-editor/ CV editing and diff UI
components/roast/     Persona, roast, critique, and controls UI
components/score/     Survival Score UI
components/upload/    PDF upload UI
firebase/             Firebase client, admin, auth, and session helpers
lib/                  Gemini, persona, critique, PDF parser, and utilities
public/               Static assets
```

## Firebase Data

Roast sessions are saved per authenticated user:

```txt
users/{uid}/sessions/{sessionId}
```

Each session can store the CV text, persona id, target role, target company, roast output, score, structured critique, status, and error message.

## Validation

Before shipping changes, run:

```bash
npm run lint
npm run build
```

Use the Firebase health endpoint to verify Firebase Admin setup after configuring service account variables:

```txt
http://localhost:3000/api/firebase-health
```

## Deployment Notes

- Set all environment variables in the hosting provider.
- Make sure `NEXT_PUBLIC_*` Firebase values are available at build time.
- Keep service account variables server-only.
- Vertex AI and Firebase Admin routes use the Node.js runtime.
- The streaming roast endpoint can take longer on cold starts, so use a platform that supports streaming responses and sufficient function duration.
