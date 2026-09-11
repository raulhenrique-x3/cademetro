# API: Authentication

JWT-based with access token and refresh token rotation. Access token expiry default: 2 hours, refresh token TTL: 7 days (sliding, renewed on each refresh).

## `POST /auth/register`

Public. Creates an account.

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

Validation rules: `email` is email format, `password` min 8 chars, `username`/`name` optional strings.

Responses:
- `201` → `RegisterResponseDto`
- `400` — validation failed.
- `409` — email already registered.

```json
{
  "id": 1,
  "message": "Account created successfully"
}
```

Clients automatically sign in with credentials after registration or direct to login.

## `POST /auth/login`

Public. Authenticates with credentials and returns tokens.

Request body:
```json
{ "email": "user@example.com", "password": "s3cret!P" }
```

Responses:
- `200` → `TokenResponseDto`
- `400` — validation failed.
- `401` — invalid credentials.
- `403` — account `SUSPENDED`.

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<rawToken>"
}
```

## `POST /auth/refresh`

Rotates an existing refresh token for a new token pair.

Request body:
```json
{ "refreshToken": "<rawToken>" }
```

Responses:
- `200` → `TokenResponseDto`
- `401` — invalid or expired refresh token.
- `403` — account `SUSPENDED`.

## `POST /auth/logout`

Revokes the provided refresh token.

Request body:
```json
{ "refreshToken": "<rawToken>" }
```

Responses:
- `200` → `{ "message": "Logged out successfully" }`

## `GET /auth/google`

Public. Inicia o login com Google. Redireciona (302) para a tela de autorização do Google.

- Query opcional: `returnUrl` (deep link de callback do app). Só `cademetro://auth/callback`,
  `exp://…/auth/callback` e `http(s)://localhost|127.0.0.1/auth/callback` são aceitos.
- Redireciona para `https://accounts.google.com/o/oauth2/v2/auth` com `client_id`, `redirect_uri`,
  `scope=openid email profile` e um `state` HMAC (payload assinado com `JWT_SECRET`, TTL 10 min;
  inclui `returnUrl` quando válido). Sem cookies.
- `503` — Google sign-in não configurado (`GOOGLE_CLIENT_ID`/`GOOGLE_CALLBACK_URL` ausentes).

## `GET /auth/google/callback`

Public. Callback OAuth (redirect URI configurada no console do Google).

- Valida a assinatura e o expiry do `state` e troca o `code` por tokens com o Google.
- Faz upsert do usuário por `googleId`; se não existir, vincula por e-mail verificado ou cria conta
  nova (sem senha).
- Sucesso: redireciona (302) para `returnUrl` do state (ou `OAUTH_REDIRECT_URL`) com
  `accessToken` e `refreshToken` na query.
- Falha: redireciona com `error=<motivo>` (`invalid_state`, `access_denied`, `account_suspended`,
  `email_unverified`, `email_in_use`, `google_unavailable`, ou o `error` devolvido pelo Google).
- Conta criada via Google não permite login por senha (`passwordHash` nulo → `401` no `POST /auth/login`).

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
- `passwordHash` is omitted from response DTOs (never serialized).
- Email is lowercased and trimmed before persistence/compare.

## Errors

- `401` on bad credentials/expired token.
- `403` on suspended account or non-permitted action.
- `409` on duplicate email during register.