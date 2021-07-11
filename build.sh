#! /bin/sh
set -e

cat $GCP_SERVICE_KEY | docker login -u _json_key --password-stdin https://$GCP_REGISTRY_HOST
tVersion=$(sh ./get-version.sh)
version=${tVersion:-1.0}
image=$GCP_REGISTRY_HOST/$GCP_PROJECT/$GCP_SERVICE:$version
docker build . -t $image
docker push $image
echo "image=$image" >> build.env
