# API: Authentication

JWT-based. **No refresh tokens** in the MVP (see `security/overview.md` for rationale). Access token
expiry is short (default **1 hour**, constant `JWT_EXPIRES_IN`).

## `POST /auth/register`

Public. Creates an account and returns a token.

Request body:
```json
{
  "email": "user@example.com",
  "password": "s3cret!P",
  "username": "metro_user",
  "name": "Metro User"
}
```
- `email` — valid email, unique.
- `password` — min 8 chars.
- `username`, `name` — optional.

Validation rules (class-validator): `email` is `@IsEmail()`, `password` is
`@MinLength(8)` / `@IsString()`, `username`/`name` optional strings.

Responses:
- `201` → `AuthResponse`
- `400` — validation failed.
- `409` — email already registered. (`409 Conflict` is added to the error map for this case.)

```json
{
  "accessToken": "<jwt>",
  "user": { "id": 1, "email": "user@example.com", "username": "metro_user", "name": "Metro User", "role": "USER", "status": "ACTIVE", "trustScore": 0.5, "createdAt": "..." }
}
```

## `POST /auth/login`

Public. Returns a token for a valid credential pair.

Request body:
```json
{ "email": "user@example.com", "password": "s3cret!P" }
```

Responses:
- `200` → `AuthResponse` (same shape as register).
- `400` — validation failed.
- `401` — invalid credentials.
- `403` — account `SUSPENDED`.

## `GET /auth/me`

Bearer token. Returns the current user.

Responses:
- `200` → `UserDto` (same shape as the `user` object above, incl. `trustScore`).
- `401` — missing/invalid/expired token.

## `PATCH /auth/me` (optional, PLANNED)

Bearer token. Updates `username` / `name`. Not required to prove the MVP hypothesis; include only if
time permits.

## Flow

```text
register/login ──► verify/issue ──► accessToken (JWT)
     client stores token (secure storage)
     sends: Authorization: Bearer <token> on protected routes
     guard verifies signature + exp + user status
```

## Implementation notes

- **Password hashing**: `bcryptjs` (pure JS, no native build). Hash on register; compare on login.
- **JWT**: `@nestjs/jwt` signs `{ sub: userId, role, status }` with `JWT_SECRET`. No refresh token.
- **Guard**: a custom `JwtAuthGuard` verifies the token via `JwtService`, loads the user, rejects
  `SUSPENDED`. The repo already has `@nestjs/passport` + `passport-http-bearer`; use them **only if
  they add value** — the MVP can use a lightweight custom guard with `@nestjs/jwt` and avoid extra
  Passport strategies. Decide during Phase 3.
- `passwordHash` is excluded from all serialization (`@Exclude()` + `ClassSerializerInterceptor`).
- Email is lowercased and trimmed before persistence/compare.

## Errors

- `401` on bad credentials/expired token.
- `403` on suspended account or non-permitted action.
- `409` on duplicate email during register.