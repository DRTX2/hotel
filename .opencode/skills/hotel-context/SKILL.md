---
name: hotel-context
description: Compact domain map of the Hotel API monorepo. Load FIRST in any hotel-api session instead of re-exploring the repo: entities, states, endpoints, conventions and sprint status.
---

# Hotel Context (token-saver — leer en vez de explorar)

## Stack
Back: NestJS 11 + TypeORM 0.3.28 + Postgres (prefijo `/v1`, Swagger `/api`). Front: Angular 21 + Tailwind 4 (vacío).

## Entidades y estados
- **Hotel**: name, city, description, rating. Índices: city, (name+city). 1:N rooms.
- **Room**: number, type `SINGLE|DOUBLE|SUITE`, status `AVAILABLE|OCCUPIED|MAINTENANCE`, basePrice>0, **capacity>0**, floor. N:1 hotel, 1:N reservations.
- **Guest**: name, email único, phone, docType+docNumber único, soft-delete.
- **Reservation**: checkIn/checkOut (`date`, YYYY-MM-DD), numGuests, totalPrice, status `PENDING|PAID|CANCELLED`. N:1 room, N:1 guest. Soft-delete.
- **User**: email único (lowercase), passwordHash bcrypt (nunca expuesto), role `admin|staff|guest`, refreshTokenHash SHA-256.
- Base: `id` interno, `publicId` UUID expuesto, createdAt/updatedAt/deletedAt.
- **Columnas en snake_case explícito** (`@Column({name})`): la migración inicial usa snake y es inmutable; las entidades lo mapean.

## Reglas de negocio (fuente de verdad)
1. `totalPrice = noches × room.basePrice`, noches = días calendario entre checkIn (incl.) y checkOut (excl.).
2. Solape = `nueva.checkIn < existente.checkOut && existente.checkIn < nueva.checkOut` (solo contra `PENDING|PAID`).
3. `numGuests <= room.capacity`; `checkOut > checkIn`.
4. Check-in: reserva `PENDING|PAID` → habitación `OCCUPIED`. Check-out/cancelación: habitación → `AVAILABLE`.
5. Cancelación: ≥7 días 100% reembolso, 48h–7d 50%, <48h 0% (política Sprint 1).

## Endpoints
CRUD `/v1/hotels|rooms|guests|reservations` + paginación `?page&limit`. Clave: `GET /v1/rooms/available?checkIn&checkOut&guests&city`, `GET /v1/health/live|ready`, `POST /v1/reservations/{id}/check-in|check-out|cancel`, `PATCH /v1/reservations/{id}`, `POST /v1/auth/register|login|refresh|logout`, `GET /v1/auth/me`, `POST /v1/auth/users` (admin).

## Seguridad (Sprint 2)
Guards globales: `JwtAuthGuard` + `RolesGuard` (jerárquico admin⊃staff⊃guest). Público: health, auth base, GET hoteles/rooms/disponibilidad. Staff+: writes de catálogo, guests (PII), ciclo de reservas. Registro público = guest; `role` en register → 400. `@nestjs/jwt@11` (no subir a v12: ESM-only, rompe jest).

## Archivos de referencia rápida
- Lógica reservas: `back/src/modules/reservation/reservation.service.ts`
- Auth: `back/src/modules/auth/` (service, guards, decorators)
- Env centralizado: `back/src/config/env.ts` (cargado vía `load-env.ts` como primer import)
- Bootstrap/seguridad: `back/src/main.ts` · Módulos: `back/src/app.module.ts`
- Backlog: `docs/PRODUCT_BACKLOG.md` · Reglas de sesión: `AGENTS.md` (raíz)

## Estado sprints
- Sprint 0 (higiene: docker/health/seeders/CORS/E2E): ✅ verificado
- Sprint 1 (booking real): ✅ verificado · Sprint 2 (auth JWT+RBAC): ✅ verificado
