# Invoice Management API — NestJS Newcomer Guide

This doc is for someone coming from Express/Node middleware into Nest. It explains the Nest building blocks and how they show up in this codebase.

## 1) Mental model
- Nest wraps the same Node/Express HTTP server but adds structure. It is opinionated: each feature is a **module** that owns a **controller** (HTTP layer) and **providers** (services, repositories, guards).
- You still use familiar pieces (JWT, TypeORM, env vars), but wiring is declarative via decorators instead of hand-written middleware chains.

## 2) Request pipeline (how a request is handled)
1. **Middleware** (not much in this repo yet): runs before routing; good for cross-cutting concerns (e.g., logging, tenant lookup).
2. **Guards**: decide “can this request continue?” (e.g., `JwtAuthGuard` checks JWT validity). They short-circuit with `401/403` if needed.
3. **Interceptors**: wrap controller execution (logging, response mapping) — none in this repo yet.
4. **Pipes**: validate/transform incoming data (e.g., `class-validator`) — DTOs exist but validation pipes are not yet wired globally.
5. **Controllers**: route definitions that accept DTOs and delegate to services.
6. **Services**: business logic and database access.
7. **Exception filters**: catch thrown exceptions and map to HTTP responses (Nest has sensible defaults; no custom filters here).

## 3) Core Nest concepts mapped to this repo
- **Modules** (`@Module`): group related controllers/providers. Example: `src/auth/auth.module.ts` imports TypeORM repositories, configures JWT, and provides `AuthService` + `JwtStrategy`.
- **Controllers** (`@Controller`): declare routes. Example: `src/auth/auth.controller.ts` exposes `POST /auth/register-tenant` and `POST /auth/login`.
- **Providers/Services** (`@Injectable`): classes managed by Nest’s dependency injection (DI). Example: `AuthService` gets `DataSource` and `JwtService` injected.
- **Dependency Injection**: Nest creates class instances for you. In `AuthService`, the constructor parameters (`DataSource`, `JwtService`) are resolved because the module imported `TypeOrmModule` and `JwtModule`.
- **Guards**: authorization gatekeepers. `src/core/auth/jwt-auth.guard.ts` extends Nest’s `AuthGuard('jwt')` to plug Passport JWT validation into the pipeline.
- **Strategies**: Passport-specific validation logic. `src/core/auth/jwt.strategy.ts` defines how to extract/verify the token and what to attach to `req.user`.
- **DTOs**: request payload shapes. `src/auth/dto/login.dto.ts` and `src/auth/dto/register-tenant.dto.ts` describe expected inputs.
- **Entities**: TypeORM models mapping to database tables (e.g., `src/users/entities/user.entity.ts`, `src/organizations/entities/organization.entity.ts`).
- **Migrations**: versioned SQL changes in `src/migrations/*.ts`.

## 4) How authentication works here
- **Register** (`POST /auth/register-tenant`):
  - `AuthController` forwards to `AuthService.registerTenant`.
  - `AuthService` uses a TypeORM `QueryRunner` transaction to create a user, organization, default admin role, role-permission mappings, and the membership link (`UserOrganization`).
  - Passwords are hashed with `bcryptjs`. Organization slugs are generated with `slugify`.
- **Login** (`POST /auth/login`):
  - Validates credentials via `AuthService.validateUser` (pulls user, checks bcrypt hash).
  - Loads active memberships and the role’s permissions.
  - Builds JWT payload `{ sub, email, orgId, permissions }` and signs it with `JwtService`.
  - Returns `{ accessToken, user }`. The token is sent by clients as `Authorization: Bearer <token>`.
- **JWT verification**:
  - `JwtStrategy` configures Passport to read the token from the `Authorization` header and verify it with `JWT_SECRET` from the environment.
  - On success, `validate` returns `{ userId, email, organizationId, role }`, which becomes `req.user`.
  - `JwtAuthGuard` can be attached to routes to require a valid JWT.

## 5) Applying guards (Express vs Nest)
- Express: you might write `app.get('/invoices', jwtMiddleware, handler)`.
- Nest: add `@UseGuards(JwtAuthGuard)` on a controller/route or make it global.

Example route protection:
```ts
// some-feature.controller.ts
@UseGuards(JwtAuthGuard)
@Get('secure-endpoint')
async getSecureData(@Req() req) {
  // req.user was set by JwtStrategy.validate
  return { orgId: req.user.organizationId };
}
```

To make JWT required everywhere, you can register the guard as a global provider in `AppModule`:
```ts
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },
],
```
importing `APP_GUARD` from `@nestjs/core`.

## 6) Configuration and environment
- `ConfigModule.forRoot({ isGlobal: true })` loads `.env` so you can read `process.env` or inject `ConfigService`.
- `JwtModule.registerAsync` uses `ConfigService` to pull `JWT_SECRET`.
- Database settings are in `src/core/database/typeorm.config.ts` and use the same env vars (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).

## 7) Database access pattern
- TypeORM is the ORM. `TypeOrmModule.forRoot(typeOrmConfig)` bootstraps the connection.
- `TypeOrmModule.forFeature([User, Organization, UserOrganization])` inside `AuthModule` registers repositories for those entities.
- For multi-step operations (register-tenant), `AuthService` uses a `QueryRunner` to wrap writes in a transaction.

## 8) Project layout (quick map)
- `src/main.ts`: bootstraps Nest app and Swagger UI at `/api`.
- `src/app.module.ts`: root module; imports config, TypeORM, and `AuthModule`.
- `src/auth/*`: controllers/services/DTOs for auth plus JWT setup.
- `src/core/auth/*`: JWT strategy + guard.
- `src/core/database/*`: TypeORM config and data source.
- `src/users`, `src/organizations`, `src/permissions`: entity definitions.
- `src/migrations/*`: database migrations.
- `src/scripts/create-db.ts`: helper to create the database.

## 9) Typical “how do I…” questions
- **Add a new protected endpoint?**
  1. Create a controller method with `@Controller` + route decorator.
  2. Add `@UseGuards(JwtAuthGuard)` to require JWT.
  3. Inject a service via the constructor; implement logic there.
- **Access the authenticated user?**
  - Read `@Req() req` and use `req.user` (populated by `JwtStrategy.validate`).
- **Add validation like Express middleware?**
  - Create DTOs with `class-validator` decorators and enable the global `ValidationPipe` in `main.ts`:
    ```ts
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    ```
- **Handle cross-cutting tasks (logging/tenant resolution)?**
  - Use middleware or interceptors instead of stacking Express middlewares on routes.

## 10) Key differences vs Express middleware style
- Routing/guards/validation are decorator-driven and class-based, not function chains.
- DI is first-class: constructor injection replaces manual `require()` wiring.
- Exception handling is standardized: throwing Nest exceptions (e.g., `UnauthorizedException`) produces HTTP responses automatically.
- Auth is built on Passport strategies/guards instead of ad-hoc middleware.
- Testing defaults to unit-friendly modules; controllers/services are easy to mock because Nest constructs them for you.

## 11) Next steps to get comfortable
- Open `src/auth/auth.controller.ts` and trace into `AuthService` to see DI in action.
- Protect an endpoint with `JwtAuthGuard` and log `req.user` to see the decoded payload.
- Run migrations and hit `POST /auth/login` with Swagger UI at `/api` to watch the flow end-to-end.
