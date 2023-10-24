#!/usr/bin/env sh
set -eu
mkdir -p /var/nginx/logs
export NGINX_WWW_ROOT=/var/www/html
envsubst '${NGINX_WWW_ROOT}, ${DICOM_WEB_URI}, ${MONAI_SERVICE_URI}, ${DICOM_WEB_AUTH}, ${MONAI_SERVICE_AUTH}' < /var/nginx/conf/nginx.conf.template > /var/nginx/conf/nginx.conf
envsubst '${MONAI_SERVICE_USER_ID}, ${MONAI_SERVICE_DATASET_ID}' < /var/www/html/app-config.js.template > /var/www/html/app-config.js

wget -q https://raw.githubusercontent.com/nginx/nginx/master/conf/mime.types -O /etc/nginx/mime.types

exec "$@"
