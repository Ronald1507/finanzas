# Despliegue — Finanzas Personales

Arquitectura de producción:

- **Frontend (React + Vite)** → **Vercel** (gratis, sin tarjeta, HTTPS, no se duerme)
- **Backend (Laravel 11)** → **InfinityFree** (gratis, sin tarjeta, MySQL, no se duerme)

> ⚠️ El backend en hosting compartido tiene fricción real: **no hay SSH ni Composer ni `php artisan`** en el servidor. Esta guía resuelve cada limitación. Leela completa antes de empezar.

---

## Parte 0 — Preparación local (una vez)

Todo lo que el servidor no puede hacer, lo hacés en tu máquina y subís el resultado.

1. **Instalar dependencias de producción y optimizar autoload** (en `backend/`):
   ```powershell
   composer install --no-dev --optimize-autoloader
   ```
   Esto deja `vendor/` listo para subir (el servidor no tiene Composer).

2. **Generar una APP_KEY nueva para producción** (NO reutilices la de desarrollo):
   ```powershell
   php artisan key:generate --show
   ```
   Copiá el valor `base64:...` — lo pegás en el `.env` del servidor.

3. **NO** subas `bootstrap/cache/config.php` ni corras `config:cache` localmente: hornea rutas y variables de tu máquina. En shared hosting dejamos la config sin cachear.

---

## Parte 1 — Backend en InfinityFree

### 1.1 Crear cuenta y sitio
1. Registrate en https://infinityfree.com (no pide tarjeta).
2. Creá un **nuevo sitio** (Account → Create Account). Te dan un subdominio tipo
   `tuapp.infinityfreeapp.com` (o conectá un dominio propio si tenés).
3. Anotá los datos **FTP** (host, usuario, contraseña) del panel.

### 1.2 Crear la base de datos MySQL
1. Panel → **MySQL Databases**.
2. Creá una base (ej. `finanzas`). El panel te da el nombre real prefijado:
   `if0_XXXXXXX_finanzas`, el usuario `if0_XXXXXXX`, el host `sqlXXX.infinityfree.com`
   y la contraseña.
3. Guardá esos 4 valores → van al `.env` del servidor.

### 1.3 Activar SSL gratis (CRÍTICO)
Vercel sirve el frontend por **HTTPS**. Si la API va por HTTP, el navegador **bloquea
las llamadas** (mixed content) y la app no funciona.

1. Panel → **Free SSL Certificates** (o "SSL/TLS").
2. Emití un certificado para tu subdominio (usa Let's Encrypt). Puede tardar unos minutos.
3. Verificá que `https://tuapp.infinityfreeapp.com` cargue con candado.

### 1.4 Estructura de archivos en el servidor (segura)

Al conectarte por FTP caés en una carpeta que contiene `htdocs/`. **Solo `htdocs/` es
público.** Para no exponer `.env` ni el código fuente, dejamos Laravel FUERA de `htdocs`:

```
/ (raíz FTP)
├── laravel/            ← TODO el proyecto Laravel MENOS la carpeta public/
│   ├── app/  bootstrap/  config/  database/  routes/  vendor/  ...
│   └── .env            ← fuera del alcance del navegador = seguro
└── htdocs/             ← raíz web
    ├── index.php       ← copiado de public/, con rutas editadas (ver abajo)
    ├── .htaccess       ← copiado de public/
    └── (resto de public/: favicon, build assets, etc.)
```

**Pasos:**
1. Subí todo el contenido de `backend/` a la carpeta `laravel/` **excepto** `public/`.
2. Subí el contenido de `backend/public/` dentro de `htdocs/`.
3. Editá `htdocs/index.php` y ajustá las dos rutas para que apunten a `../laravel`:
   ```php
   require __DIR__.'/../laravel/vendor/autoload.php';
   $app = require_once __DIR__.'/../laravel/bootstrap/app.php';
   ```
4. Permisos de escritura (FTP → File permissions → 755) en
   `laravel/storage/` y `laravel/bootstrap/cache/` (y subcarpetas).

> Alternativa más simple pero menos segura: subir todo el proyecto dentro de `htdocs/` y
> agregar `htdocs/.htaccess` con `RewriteRule ^(.*)$ public/$1 [L]`. No recomendado:
> deja el código y el `.env` bajo la raíz web.

### 1.5 Crear el `.env` del servidor
1. Tomá `backend/.env.production.example` como base.
2. Creá `laravel/.env` en el servidor (vía File Manager o FTP) con esos valores:
   - `APP_KEY` = la que generaste en Parte 0.
   - `APP_URL` = `https://tuapp.infinityfreeapp.com`
   - `CORS_ALLOWED_ORIGINS` = la URL de Vercel (la tendrás tras la Parte 2; podés volver a editar).
   - Los 4 datos de MySQL del paso 1.2.

### 1.6 Correr las migraciones SIN consola (clave)

InfinityFree no tiene `php artisan`. Usamos una **ruta web temporal y protegida**:

1. Agregá en `backend/routes/web.php` (ANTES de subir, o editá en el servidor):
   ```php
   use Illuminate\Support\Facades\Artisan;

   Route::get('/__deploy/migrate/{token}', function (string $token) {
       abort_unless($token === env('MIGRATE_TOKEN'), 403);
       Artisan::call('migrate', ['--force' => true]);
       return '<pre>'.e(Artisan::output()).'</pre>';
   });
   ```
2. En el `.env` del servidor agregá un secreto: `MIGRATE_TOKEN=algo-largo-y-random`.
3. Visitá una vez:
   `https://tuapp.infinityfreeapp.com/__deploy/migrate/algo-largo-y-random`
   Deberías ver el listado de migraciones aplicadas.
4. **ELIMINÁ esa ruta** del archivo y volvé a subir `web.php` (o borrala en el servidor).
   Dejarla abierta es un riesgo de seguridad.

> Alternativa: si tenés MySQL local, corré `php artisan migrate` local, exportá el dump
> y luego importalo por **phpMyAdmin** del panel. Más pasos, pero sin tocar rutas.

### 1.7 Verificar
- `https://tuapp.infinityfreeapp.com/api/...` (algún endpoint GET de listado) debe responder JSON.
- Consultas manuales: panel → **phpMyAdmin**, o conectá DBeaver/MySQL Workbench con
  los datos de MySQL del paso 1.2.

---

## Parte 2 — Frontend en Vercel

1. Entrá a https://vercel.com con tu cuenta de GitHub (sin tarjeta).
2. **Import Project** → elegí el repo.
3. Configuración del proyecto:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (lo detecta solo)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Environment Variables** (Settings → Environment Variables):
   - `VITE_API_URL` = `https://tuapp.infinityfreeapp.com/api`  ← ¡con `/api` al final y HTTPS!
   - `VITE_API_TIMEOUT` = `30000`
   - `VITE_APP_NAME` = `Finanzas Personales`
5. **Deploy.** Vercel te da una URL tipo `https://finanzas-xxx.vercel.app`.

### 2.1 Cerrar el círculo CORS
1. Copiá la URL final de Vercel.
2. En el `.env` del servidor (InfinityFree) poné:
   `CORS_ALLOWED_ORIGINS=https://finanzas-xxx.vercel.app`
   (varios dominios separados por coma si hace falta).
3. Listo: el frontend HTTPS de Vercel habla con la API HTTPS de InfinityFree.

---

## Checklist de gotchas

- [ ] `composer install --no-dev --optimize-autoloader` corrido local y `vendor/` subido.
- [ ] APP_KEY de producción generada nueva (no la de dev).
- [ ] `APP_ENV=production` y `APP_DEBUG=false` en el `.env` del servidor.
- [ ] SSL activo en InfinityFree (HTTPS con candado) — si no, mixed content rompe todo.
- [ ] `index.php` con rutas apuntando a `../laravel`.
- [ ] Permisos 755 en `storage/` y `bootstrap/cache/`.
- [ ] Migraciones corridas y **ruta `__deploy/migrate` eliminada**.
- [ ] `QUEUE_CONNECTION=sync` (no hay worker en shared hosting).
- [ ] `VITE_API_URL` en Vercel apunta a la API HTTPS con `/api`.
- [ ] `CORS_ALLOWED_ORIGINS` en el backend = dominio exacto de Vercel.

## Limitaciones conocidas de InfinityFree

- Sin `php artisan` ni cron en el servidor → tareas programadas y colas reales no corren
  (por eso `QUEUE_CONNECTION=sync`).
- Límites de CPU y de "hits" diarios (50k/día): sobra para uso personal/pocos usuarios.
- Si más adelante querés algo sin estas fricciones: **Oracle Cloud Always Free** (VPS real,
  Postgres, control total) es el siguiente paso natural — solo pide tarjeta para verificar.
