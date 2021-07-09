#! /bin/bash
set -e

if [ -f .env ]; then
  source .env
fi

tVersion=$(node get-version.js)
pVersion=${tVersion:-1.0}
read -p "Container version $pVersion? " uVersion
version=${uVersion:-$pVersion}
gcloud config set project $GOOGLE_CLOUD_PROJECT
image=gcr.io/$GOOGLE_CLOUD_PROJECT/$GOOGLE_CLOUD_SERVICE:$version
gcloud builds submit --tag $image
gcloud run deploy $GOOGLE_CLOUD_SERVICE --image $image --region $GOOGLE_CLOUD_REGION --platform managed --quiet --allow-unauthenticated --concurrency 5 --labels stage=prod
