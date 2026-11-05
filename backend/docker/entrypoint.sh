#!/bin/sh
set -e

mkdir -p storage/framework/cache \
         storage/framework/sessions \
         storage/framework/views \
         storage/logs \
         bootstrap/cache

php artisan package:discover --ansi
php artisan migrate --force

exec "$@"
