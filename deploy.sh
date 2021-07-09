#! /bin/bash
set -e

if [ -f .env ]; then
  source .env
fi

tVersion=$(node get-version.js)
pVersion=${tVersion:-1.0}
read -p "Container version $pVersion? " uVersion
version=${uVersion:-$pVersion}
gcloud config set project $GCP_PROJECT
image=gcr.io/$GCP_PROJECT/$GCP_SERVICE:$version
gcloud builds submit --tag $image
gcloud run deploy $GCP_SERVICE --image $image --region $GCP_REGION --platform managed --quiet --allow-unauthenticated --concurrency 5 --labels stage=prod
