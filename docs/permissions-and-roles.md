# Permissions & Roles Guide

This backend uses organization-scoped roles that are mapped to global permissions. Below is a reference for the schema, seeded permissions, and how to work with roles and assignments.

## Schema (from migrations)
- `1733756400000-AuthBase`: creates `users`, `organizations`, `user_organizations` (membership), and related auth tables. The legacy `user_organizations.role` text column was later replaced.
- `1765792843181-UserRolePermissions`: adds `roles` (per-organization, `is_system_role` flag), `permissions` (global catalog), and `role_permissions` (junction). Updates `user_organizations` to use `role_id` FK instead of the old text role.
- `1765799222186-SeedCorePermissions`: inserts the initial permission catalog (id generated with `gen_random_uuid()`); `ON CONFLICT (name) DO NOTHING` keeps the migration idempotent.

### Tables at a glance
- `roles`: `{ id, organization_id, name, is_system_role, created_at, updated_at }` unique per `organization_id + name`.
- `permissions`: `{ id, name UNIQUE, description, created_at }` global list reused by all tenants.
- `role_permissions`: `{ id, role_id, permission_id }` unique per `role_id + permission_id`.
- `user_organizations`: `{ id, user_id, organization_id, role_id, status }` links a user to an org and the role they hold (`status` like `active`/`disabled`/`invited`).

## Seeded permission catalog
Inserted by `1765799222186-SeedCorePermissions.ts`:

- Organization management: `org:manage:users` (invite/remove/change roles), `org:manage:roles` (create/edit/delete roles & perms), `org:view:settings`, `org:update:settings`, `org:view:billing`.
- User lifecycle: `user:activate`, `user:disable`.
- Customers: `customer:view`, `customer:create`, `customer:edit`, `customer:delete`.
- Invoices: `invoice:view:all`, `invoice:view:self`, `invoice:create`, `invoice:edit:draft`, `invoice:finalize`, `invoice:cancel`, `invoice:delete`.
- Reporting & audit: `report:view:financial`, `audit:view:logs`.

## Runtime authorization flow
- During login (`src/auth/auth.service.ts`), the service loads `RolePermission` records for the member’s `role_id`, maps them to permission names, and embeds the list in the JWT payload (`payload.permissions`).
- Controllers decorate routes with `@RequirePermissions(...)` (`src/core/auth/permissions.decorator.ts`).
- `PermissionsGuard` (`src/core/auth/permissions.guard.ts`) checks that every required permission is present in `request.user.permissions` (set by JWT auth). Missing permissions produce `403 Forbidden`.

## System role seeding
- Tenant registration (`AuthService.registerTenant`) creates a system `Admin` role (`is_system_role = true`) for the new organization.
- All permissions from the `permissions` table are attached to this `Admin` role through `role_permissions`.
- Ensure new members created for that org are linked to this role via `user_organizations.role_id` so they inherit permissions.

## Working with roles and permissions
1) **Create a role** (per org)  
   - Insert into `roles` with `organization_id`, `name`, and optional `is_system_role`.
2) **Attach permissions**  
   - For each permission to grant, add a row in `role_permissions` with the `role_id` and `permission_id`. Use only names from the `permissions` catalog (or insert a new permission first—see below).
3) **Assign the role to a user**  
   - Update/create the membership row in `user_organizations` for that user/org with the `role_id` and set `status` to `active`.
4) **Require permissions in code**  
   - Decorate routes with `@RequirePermissions('permission:name')`; the guard enforces presence of **all** listed permissions.

## Adding or adjusting permissions
- **Add a new permission**: create a migration that inserts into `permissions` (mirroring the seeding style) and, if desired, seeds corresponding `role_permissions` for system roles.
- **Deprecate/change**: adjust assignments in `role_permissions` and update any route decorators that reference the old key.
- **Validation**: when you introduce a new route action, add a `@RequirePermissions` decorator and ensure the relevant roles include that permission.

## Quick SQL snippets (psql)
```sql
-- List permissions for a role
SELECT p.name, p.description
FROM role_permissions rp
JOIN permissions p ON p.id = rp.permission_id
WHERE rp.role_id = '<ROLE_UUID>';

-- Assign an existing permission to a role
INSERT INTO role_permissions (id, role_id, permission_id)
VALUES (gen_random_uuid(), '<ROLE_UUID>', '<PERMISSION_UUID>')
ON CONFLICT (role_id, permission_id) DO NOTHING;
```
