#!/usr/bin/env bash
# One-time GCP setup for ExportReady production on Cloud Run.
# Usage: ./scripts/gcp-setup.sh YOUR_GCP_PROJECT_ID

set -euo pipefail

PROJECT_ID="${1:-}"
REGION="${REGION:-asia-southeast2}"
AR_REPO="${AR_REPO:-exportready}"
SERVICE="${SERVICE:-exportready-prod}"

if [[ -z "$PROJECT_ID" ]]; then
  echo "Usage: $0 YOUR_GCP_PROJECT_ID"
  exit 1
fi

echo "==> Project: $PROJECT_ID (region: $REGION)"

gcloud config set project "$PROJECT_ID"

echo "==> Enabling APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  --project="$PROJECT_ID"

echo "==> Creating Artifact Registry repository (if missing)..."
if ! gcloud artifacts repositories describe "$AR_REPO" \
  --location="$REGION" \
  --project="$PROJECT_ID" &>/dev/null; then
  gcloud artifacts repositories create "$AR_REPO" \
    --repository-format=docker \
    --location="$REGION" \
    --description="ExportReady production images" \
    --project="$PROJECT_ID"
fi

echo "==> Granting Cloud Build permission to deploy Cloud Run..."
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/run.admin" \
  --quiet >/dev/null

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/iam.serviceAccountUser" \
  --quiet >/dev/null

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/artifactregistry.writer" \
  --quiet >/dev/null

echo "==> Secret Manager: create secrets if they do not exist"
for SECRET in GEMINI_API_KEY; do
  if ! gcloud secrets describe "$SECRET" --project="$PROJECT_ID" &>/dev/null; then
    echo "    Creating secret $SECRET (add a version after this script):"
    gcloud secrets create "$SECRET" --replication-policy=automatic --project="$PROJECT_ID"
    echo "    Run: echo -n 'YOUR_KEY' | gcloud secrets versions add $SECRET --data-file=-"
  else
    echo "    Secret $SECRET already exists"
  fi
done

echo ""
echo "==> Done. Next steps:"
echo "  1. Add secret version: gcloud secrets versions add GEMINI_API_KEY --data-file=-"
echo "  2. Deploy once manually (see docs/DEPLOYMENT.md)"
echo "  3. Set NEXT_PUBLIC_SITE_URL to the Cloud Run URL, then redeploy"
echo "  4. Add Cloud Run + Vercel URLs to Supabase Auth redirect URLs"
echo "  5. Create a Cloud Build trigger with substitutions from .env.example"
