#!/bin/sh
set -e

mkdir -p database \
         storage/framework/cache \
         storage/framework/sessions \
         storage/framework/views \
         storage/logs \
         bootstrap/cache
touch database/database.sqlite

php artisan migrate --force

exec "$@"
