## ADDED Requirements

### Requirement: Registro de usuario
El sistema SHALL permitir crear una cuenta con nombre, email y contraseña. Al registrarse exitosamente, SHALL retornar el usuario creado y un token de acceso personal (Sanctum).

#### Scenario: Registro exitoso
- **WHEN** se envía `POST /api/register` con `name`, `email` y `password` válidos
- **THEN** el sistema crea el usuario, retorna `{ user, token }` con HTTP 201

#### Scenario: Email duplicado
- **WHEN** se envía `POST /api/register` con un email ya registrado
- **THEN** el sistema retorna HTTP 422 con error de validación en el campo `email`

#### Scenario: Datos inválidos
- **WHEN** se envía `POST /api/register` con campos faltantes o password menor a 8 caracteres
- **THEN** el sistema retorna HTTP 422 con los errores de validación correspondientes

### Requirement: Login de usuario
El sistema SHALL autenticar a un usuario existente mediante email y contraseña y retornar un token de acceso personal (Sanctum).

#### Scenario: Login exitoso
- **WHEN** se envía `POST /api/login` con `email` y `password` correctos
- **THEN** el sistema retorna `{ user, token }` con HTTP 200

#### Scenario: Credenciales incorrectas
- **WHEN** se envía `POST /api/login` con email o password incorrectos
- **THEN** el sistema retorna HTTP 401 con mensaje de error genérico (sin revelar cuál campo falla)

### Requirement: Logout de usuario
El sistema SHALL invalidar el token del usuario autenticado al hacer logout.

#### Scenario: Logout exitoso
- **WHEN** se envía `POST /api/logout` con token válido en el header `Authorization: Bearer <token>`
- **THEN** el sistema elimina el token actual y retorna HTTP 200

#### Scenario: Logout sin autenticación
- **WHEN** se envía `POST /api/logout` sin token o con token inválido
- **THEN** el sistema retorna HTTP 401

### Requirement: Perfil del usuario autenticado
El sistema SHALL retornar los datos del usuario autenticado.

#### Scenario: Obtener perfil
- **WHEN** se envía `GET /api/me` con token válido
- **THEN** el sistema retorna `{ id, name, email, created_at }` con HTTP 200

### Requirement: Protección de rutas existentes
Todos los endpoints existentes del sistema SHALL requerir autenticación válida mediante Sanctum.

#### Scenario: Acceso sin token
- **WHEN** se accede a cualquier endpoint protegido sin header `Authorization`
- **THEN** el sistema retorna HTTP 401

#### Scenario: Acceso con token inválido o expirado
- **WHEN** se accede a cualquier endpoint protegido con token inválido
- **THEN** el sistema retorna HTTP 401
