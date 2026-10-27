# ── base: shared PHP extensions and Composer ────────────────────────────────
FROM php:8.3-cli-alpine AS base

RUN apk add --no-cache linux-headers sqlite-dev mysql-dev \
    && docker-php-ext-install pdo pdo_sqlite pdo_mysql

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# ── dev: full deps (including dev), artisan serve ───────────────────────────
FROM base AS dev

RUN composer install

COPY . .

EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]

# ── prod: no dev deps, optimized autoloader ─────────────────────────────────
FROM base AS prod

RUN composer install --no-dev --optimize-autoloader

COPY . .

RUN chown -R www-data:www-data storage bootstrap/cache

EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
