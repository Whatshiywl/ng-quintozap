#! /bin/sh
set -e

gcloud auth activate-service-account --project $GCP_PROJECT --key-file $GCP_SERVICE_KEY
gcloud config set project $GCP_PROJECT
gcloud run deploy $GCP_SERVICE --service-account $GCP_SERVICE_ACCOUNT --image $image --region $GCP_REGION --platform managed --quiet --allow-unauthenticated --concurrency 5 --labels stage=prod
