## `README.md`

# 🏗️ NestJS Application Architecture

This document outlines the standard folder structure and architectural conventions used within the `src/` directory of the Invoice Management System.

Our architecture is **Feature-Driven (Module-Driven)**, ensuring high cohesion and low coupling between business domains.

## 1\. Top-Level Structure

All core application logic resides in the `src/` directory, separated into global components (`core/`) and self-contained business features (e.g., `invoices/`, `organizations/`).

```
/
├── node_modules/
├── src/
│   ├── core/                    # Global, Shared Components (App-wide)
│   │   ├── auth/                # JWT strategy, Global Auth Guard (IsLoggedIn)
│   │   ├── filters/             # Global exception filters
│   │   ├── pipes/               # Global validation pipe
│   │   ├── middleware/          # TenantContextMiddleware (Critical for setting Org ID)
│   │   └── database/            # TypeORM config, migrations
│   │
│   ├── auth/                    # Auth Module (Login, Register, Password Reset)
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts   # POST /auth/login, POST /auth/register-tenant
│   │   └── auth.service.ts
│   │
│   ├── organizations/           # The Tenant Management Module
│   │   ├── organizations.module.ts
│   │   ├── organizations.service.ts
│   │   ├── entities/
│   │   │   ├── organization.entity.ts
│   │   │   ├── user-organization.entity.ts # Key: Relationship/Role
│   │   │   └── subscription.entity.ts
│   │   └── dto/
│   │
│   ├── users/                   # Global User Management (Profile, CRUD by Admin)
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   └── users.service.ts
│   │
│   ├── invoices/                # Core Business Feature (Invoice Creation/CRUD)
│   │   ├── invoices.module.ts
│   │   ├── invoices.controller.ts
│   │   ├── invoices.service.ts  # All methods scoped by organization_id
│   │   ├── entities/
│   │   │   ├── invoice.entity.ts
│   │   │   └── invoice-item.entity.ts
│   │   └── dto/
│   │
│   ├── customers/               # Customer/Contact Management Module
│   │   ├── customers.module.ts
│   │   ├── customers.service.ts
│   │   └── entities/
│   │       └── customer.entity.ts # Linked to organization_id
│   │
│   ├── payments/                # Payment Processing and History
│   │   ├── payments.module.ts
│   │   └── payments.service.ts  # Stripe/Payment Gateway integration
│   │
│   ├── audit-logs/              # Dedicated module for logging activity
│   │   ├── audit-logs.module.ts
│   │   └── audit-logs.service.ts # Used by other modules to record actions
│   │
│   ├── app.module.ts            # Root module (imports all the above feature modules)
│   └── main.ts
│
└── package.json
```

s
