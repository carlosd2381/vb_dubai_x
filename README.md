# VB Travel Advisor · Website + CRM

Sitio web para agencia de viajes con promociones, tours y panel admin con CRM básico.

## Funcionalidades implementadas

- Sitio público bilingüe (español por defecto + cambio a inglés)
- UX simple con navegación directa y formularios claros
- Login seguro para asesores (sesión HTTP-only)
- Gestión admin de contenido:
	- Hero section (texto + imagen/video)
	- Tour upload (datos + foto + video opcional)
	- Client review upload
- CRM de clientes:
	- Alta automática desde formulario de contacto
	- Alta manual desde admin
	- Datos de contacto, servicios deseados, fechas de viaje
	- Historial de comunicación
	- Tareas por cliente

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma + SQLite
- Autenticación con JWT firmado (`jose`) + cookies seguras

## Configuración local

### Variables de entorno

Para SQLite local (legacy):

```bash
DATABASE_URL="file:./dev.db"
```

Para Postgres/Supabase (staging/production):

```bash
DATABASE_URL="<SUPABASE_POOLER_URL>"
DIRECT_URL="<SUPABASE_DIRECT_URL>"
JWT_SECRET="<SECRET>"
```

1) Instalar dependencias

```bash
npm install
```

2) Migrar base de datos

```bash
npm run db:migrate -- --name init
```

Si estás iniciando en Supabase desde este repo (primera vez en Postgres), usa:

```bash
npm run db:push
```

3) Cargar datos iniciales

```bash
npm run db:seed
```

4) Ejecutar entorno local

```bash
npm run dev
```

Abrir: http://localhost:3000


```

## Estructura principal

- Público: `/`, `/destinations`, `/tours`, `/contact`
- Admin: `/admin`, `/admin/site`, `/admin/crm/clientes`

## Staging y aprobación de agencia

- Guía recomendada para compartir preview, recolectar feedback y pasar a producción:
	- [docs/staging-approval-checklist.md](docs/staging-approval-checklist.md)

## Próximos módulos (roadmap)

- Itinerary & Proposal Builder
- Invoicing & Commission Tracking
- Full Email Integration
- AI integration
