#!/bin/sh
set -e

mkdir -p database
touch database/database.sqlite
php artisan migrate --force

exec "$@"
