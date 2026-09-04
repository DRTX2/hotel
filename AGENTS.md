# AGENTS.md — Hotel API (monorepo: `back/` NestJS + `front/` Angular)

> Lee este archivo al inicio de cada sesión. Es el sistema anti-pérdida de contexto del proyecto.
> Detalle de dominio: `.opencode/skills/hotel-context/SKILL.md`. Backlog: `docs/PRODUCT_BACKLOG.md`.

## Mapa en 10 segundos

- `back/src/modules/{hotel,room,guest,reservation}/` — CRUD + DTOs (`create-*`, `update-*`, `*-response`). Entidades con `BaseEntity` (`publicId` UUID expuesto, `id` interno, soft-delete).
- `back/src/common/` — `filters/`, `interceptors/`, `pagination/`. Respuestas paginadas vía `PaginationService`.
- Prefijo global `/v1`, Swagger en `/api`, `ValidationPipe` estricto (`whitelist + forbidNonWhitelisted`).
- Migraciones TypeORM en `back/src/migrations/` — **nunca editar una migración aplicada**; crear una nueva.
- Front Angular 21 + Tailwind: esqueleto vacío, `routes: []`. No tocar hasta que el back de Sprints 0–2 esté verde.

## Skills: cuándo cargarlas (bajo consumo de tokens)

| Situación | Skill global a cargar |
|-----------|----------------------|
| Tocar Postgres/migración/índice/query | `supabase-postgres-best-practices` |
| Diseñar acceso a datos / revisar N+1 | `database-performance` |
| Tocar `front/` | `angular-developer` |
| Tests E2E navegador / flujos front | `playwright-best-practices` |
| Antes de decir "listo / pasa / done" | `verification-before-completion` (siempre) |

No cargues skills preventivamente: solo la que pida la tarea actual.

## Estándares senior (no negociables)

1. **Package manager back: npm** (hay `package-lock.json` commiteado; `pnpm-lock.yaml` es resto sin trackear). Comandos se corren con `workdir=back`.
2. **Dinero y fechas en back:** precio = `noches × basePrice` (noches = diff calendario, checkOut exclusivo); solapamiento = `nueva.checkIn < existente.checkOut && existente.checkIn < nueva.checkOut`; estados de reserva `PENDING|PAID|CANCELLED`, de habitación `AVAILABLE|OCCUPIED|MAINTENANCE`.
3. **Seguridad:** nunca loguear PII/passwords; CORS y rate-limit por env; validación en DTO, no en controller.
4. **DB:** FKs con índice, `timestamptz` para timestamps y `date` para checkIn/checkOut (noches calendario), constraint de exclusión para anti-solape, migración nueva por cambio.
5. **Verificación:** afirmar "done" solo con evidencia fresca de `npm run build`, `npm run lint`, `npx jest` / `npm run test:e2e` según aplique.
6. **Commits:** no commitear salvo pedido explícito. Rama de trabajo: `develop`.
