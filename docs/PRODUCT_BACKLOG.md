# Product Backlog — Hotel API | Visión PO + Fullstack Senior

**Fecha:** Septiembre 2026 · **Rama base:** `develop` · **Estado:** Sprints 0–2 completados y verificados (build + lint + 11 unit + 16 e2e en verde; `docker compose up` funcional).

> Fuente técnica: `back/docs/PROJECT_STATUS_REPORT.md` (score 5.1/10) y `back/docs/EXPANDED_FEATURES.md`.
> Este documento es el backlog priorizado y accionable. Los reportes anteriores son diagnóstico; esto es el plan.

---

## 1. Veredicto de producto (PO)

Hay CRUD de 4 entidades, no hay producto. Defectos bloqueantes de negocio verificados en código:

| # | Defecto | Evidencia | Impacto |
|---|---------|-----------|---------|
| 1 | Precio hardcodeado a 1 noche | `back/src/modules/reservation/reservation.service.ts:37` | Se cobra mal siempre |
| 2 | Sin anti-overbooking (solapamiento de fechas) | `reservation.service.ts` — `create()` no consulta reservas existentes | Doble venta de la misma habitación |
| 3 | Sin validación capacidad vs huéspedes | `create()` no cruza `numGuests` con `room.capacity` | Overbooking de personas |
| 4 | `update()` de reserva inexistente | `reservation.service.ts` solo tiene create/findAll/findOne/remove | Endpoint PUT roto o mock |
| 5 | Sin autenticación ni RBAC | `back/src/app.module.ts` — sin `AuthModule` | Cualquiera opera todo |
| 6 | Front vacío | `front/src/app/app.routes.ts` — `routes: []` | 0% utilizable |

---

## 2. Pendiente crítico (bloqueante de producción)

- [x] **S0-1** Docker + Compose (api + postgres + redis) + `.dockerignore`
- [x] **S0-2** `GET /v1/health` (liveness) + readiness con check de DB
- [x] **S0-3** CORS restrictivo por env (`main.ts:19` hoy acepta todo)
- [x] **S0-4** Rate-limit con Redis store (hoy en memoria, inútil con réplicas)
- [x] **S0-5** Seeders de desarrollo (hoteles, habitaciones, huéspedes, reservas)
- [x] **S0-6** E2E happy-path booking (crear hotel → habitación → huésped → reserva → verificar precio)

## 3. Sin completar / a medias (deuda)

- [ ] Logging estructurado JSON (hoy `Logger` plano) → Pino/Winston + correlation-id
- [ ] `AllExceptionsFilter` con formato de error estable `{ code, message, details, traceId }`
- [ ] Índices FK + parciales donde apliquen; revisar N+1 en `findAll` con joins
- [ ] Migraciones: segunda migración para lo nuevo (no editar la inicial)
- [ ] Terraform incompleto; decidir estrategia (Compose local + Terraform AWS solo prod)
- [ ] Decisión package manager: hay `package-lock.json` (commiteado) y `pnpm-lock.yaml` (untracked) → **estándar: npm**, eliminar el otro
- [ ] Docs huérfanos sin trackear en git (`PROJECT_STATUS_REPORT.md`, `EXPANDED_FEATURES.md`)

## 4. Funcionalidades clave (MVP vendible)

1. **Booking correcto** — precio por noches, anti-solape con transacción + constraint de exclusión, capacidad, máquina de estados reserva + habitación en check-in/out automático.
2. **Auth + RBAC** — JWT access/refresh, roles `admin/staff/guest`, guards globales, hash Argon2/bcrypt.
3. **Disponibilidad** — `GET /v1/rooms/available?checkIn&checkOut&guests&city`.
4. **Cancelación con política** — reembolso según antelación (≥7d 100%, 48h–7d 50%, <48h 0%).
5. **Front mínimo operativo** — catálogo, disponibilidad, checkout, panel admin.
6. **Pagos + notificaciones** — Stripe webhooks + cola email (BullMQ+Redis).
7. **Reviews + fotos** — entidad `Review`, upload S3/CDN.

## 5. Innovación (diferenciador, post-MVP)

- Pricing dinámico por ocupación/antelación/temporada
- Disponibilidad realtime por WebSocket + invalidación Redis
- Recomendaciones por historial (heurístico → colaborativo)
- Dashboard ADR / Ocupación / RevPAR + forecasting de demanda
- OCR de documento en check-in, housekeeping auto-asignado, loyalty por niveles

## 6. Roadmap ejecutado en este repo

- **Sprint 0 — Higiene ✅:** S0-1…S0-6 + filtro de errores estable con `traceId`, `load-env.ts` determinista, `.env.test`, fix crítico de mapeo entidades↔migración (camelCase→snake_case explícito).
- **Sprint 1 — Booking real ✅:** precio por noches, anti-solape (constraint de exclusión parcial + transacción con lock pesimista), `capacity` en rooms, `update` reserva, check-in/out, cancelación con política de reembolso, `GET /rooms/available`.
- **Sprint 2 — Seguridad ✅:** Auth JWT (access 15m + refresh 7d con rotación, `jti`, detección de reuso), RBAC jerárquico admin⊃staff⊃guest, guards globales, catálogo público + writes con rol, `@nestjs/jwt@11` (v12 es ESM-only e incompatible con jest).

Regla senior: ningún sprint se declara done sin `build + lint + tests` en verde (skill `verification-before-completion`).
