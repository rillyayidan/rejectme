# Cloud Run Deployment

This app runs as a Node-backed Next.js service on Cloud Run. It uses Next.js
standalone output in Docker, Firebase client config at build time, and Google
Application Default Credentials at runtime through the Cloud Run service
account.

## Required APIs

Enable these APIs in the Google Cloud project:

- Cloud Build API
- Cloud Run Admin API
- Artifact Registry API
- Secret Manager API
- IAM Service Account Credentials API
- Vertex AI API
- Firestore API
- Firebase Management API, if managing Firebase resources from Google Cloud

## One-time setup

Create an Artifact Registry Docker repository:

```bash
gcloud artifacts repositories create cloud-run \
  --repository-format=docker \
  --location=us-central1 \
  --description="Cloud Run images"
```

Create a Cloud Run service account:

```bash
gcloud iam service-accounts create rejectme-cloud-run \
  --display-name="RejectMe Cloud Run"
```

Grant the Cloud Run service account the roles it needs. Scope these grants as
narrowly as your project allows:

- Firestore access: `roles/datastore.user`
- Firebase Admin SDK token verification/Auth access: Firebase project access for
  the service account, commonly `roles/firebase.admin` when you cannot grant a
  narrower project role
- Cloud Storage access, if file storage is used: `roles/storage.objectUser` on
  the Firebase Storage bucket
- Vertex AI Gemini access: `roles/aiplatform.user`
- Secret reads at runtime: `roles/secretmanager.secretAccessor` on required
  secrets

Grant Cloud Build permission to deploy and act as the runtime service account:

```bash
PROJECT_ID="$(gcloud config get-value project)"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud iam service-accounts add-iam-policy-binding \
  "rejectme-cloud-run@${PROJECT_ID}.iam.gserviceaccount.com" \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

Store the Firebase web API key in Secret Manager:

```bash
printf "%s" "your-firebase-web-api-key" | gcloud secrets create firebase-web-api-key \
  --data-file=-
```

Grant Cloud Build and the Cloud Run service account access to the secret:

```bash
gcloud secrets add-iam-policy-binding firebase-web-api-key \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding firebase-web-api-key \
  --member="serviceAccount:rejectme-cloud-run@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Firebase rules and indexes

Deploy Firestore rules and indexes from the committed files:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

The rules allow each authenticated user to access only
`users/{uid}` and `users/{uid}/sessions/{sessionId}`.

## Build and deploy

Submit the build with project-specific substitutions:

```bash
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_REGION=us-central1,_SERVICE_NAME=rejectme,_REPOSITORY=cloud-run,_IMAGE_NAME=rejectme,_SERVICE_ACCOUNT=rejectme-cloud-run@YOUR_PROJECT_ID.iam.gserviceaccount.com,_FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID,_FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_PROJECT_ID.firebaseapp.com,_FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_PROJECT_ID.firebasestorage.app,_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID,_FIREBASE_APP_ID=YOUR_APP_ID,_GOOGLE_CLOUD_LOCATION=us-central1,_GEMINI_MODEL=gemini-2.5-flash
```

`NEXT_PUBLIC_*` values are embedded into the browser bundle during
`next build`. Changing Firebase web config requires a new image build, not only a
Cloud Run environment variable update.

## Cloud Run runtime config

`cloudbuild.yaml` sets these runtime variables:

- `GOOGLE_CLOUD_PROJECT`
- `GOOGLE_CLOUD_LOCATION`
- `GEMINI_MODEL`
- `FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

It also mounts `NEXT_PUBLIC_FIREBASE_API_KEY` from the
`firebase-web-api-key` Secret Manager secret. The value is already built into the
client bundle, but keeping the runtime value present avoids surprises if server
code imports the Firebase config.

Do not set `FIREBASE_PRIVATE_KEY` or `FIREBASE_CLIENT_EMAIL` on Cloud Run unless
you intentionally want to use a key-based Admin SDK credential. With those unset,
the app uses the Cloud Run service identity through Application Default
Credentials.

## Firebase Auth domain

After the first deployment, add the Cloud Run service URL or your custom domain
to Firebase Authentication authorized domains. Google sign-in will fail until
the deployed domain is authorized.

## Smoke checks

After deployment:

- Open `/` and confirm the app loads.
- Sign in with Google.
- Call `/api/firebase-health` while signed in and confirm it returns `ok: true`.
- Run the main roast flow and confirm the streamed response starts.
- Confirm session history creates and reads only the current user's sessions.
