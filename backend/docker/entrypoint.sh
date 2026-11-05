#!/bin/sh
set -e

mkdir -p storage/framework/cache \
         storage/framework/sessions \
         storage/framework/views \
         storage/logs \
         bootstrap/cache

php artisan package:discover --ansi || true

echo "Waiting for database..."
until php artisan migrate --force 2>&1; do
    echo "DB not ready — retrying in 3s..."
    sleep 3
done

exec "$@"
