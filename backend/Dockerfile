# ── base: shared PHP extensions and Composer ────────────────────────────────
FROM php:8.4-cli-alpine AS base

RUN apk add --no-cache linux-headers sqlite-dev mysql-dev git unzip \
    && docker-php-ext-install pdo pdo_sqlite pdo_mysql

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

WORKDIR /var/www/html

# ── dev: install deps only; app code comes from the volume mount ─────────────
FROM base AS dev

COPY composer.json composer.lock ./
RUN composer install --no-scripts

EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]

# ── prod: no dev deps, optimized autoloader ──────────────────────────────────
FROM base AS prod

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader

COPY . .
RUN composer dump-autoload --optimize --no-scripts

RUN chown -R www-data:www-data storage bootstrap/cache

EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
