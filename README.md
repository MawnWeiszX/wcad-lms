# WCAD LMS — Monorepo

Plataforma de aprendizaje en línea (LMS) asíncrona construida con Next.js 15, React 19, Supabase y Tailwind CSS v4.

## Estructura

```
wcad-lms/
├── apps/
│   ├── class/        → App de alumnos (puerto 3000)
│   └── portal/       → Panel de profesores (puerto 3001)
├── packages/
│   ├── database/     → Schema SQL y tipos de Supabase
│   ├── utils/        → Clientes de Supabase, Bunny.net, Rate Limiting
│   └── config/       → Configuración compartida de ESLint/TypeScript
```

## Requisitos

- Node.js >= 20
- pnpm >= 9

## Instalación

```bash
pnpm install
```

## Variables de Envono

Copiar `.env.example` en cada app y completar los valores:

### `apps/class/.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_CLASS_URL=http://localhost:3000
NEXT_PUBLIC_PORTAL_URL=http://localhost:3001
BUNNY_LIBRARY_ID=
BUNNY_TOKEN_KEY=
```

### `apps/portal/.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_CLASS_URL=http://localhost:3000
BUNNY_API_KEY=
BUNNY_LIBRARY_ID=
```

## Desarrollo

```bash
# Levantar ambas apps en paralelo
pnpm dev

# Solo alumnos (class)
pnpm --filter class dev

# Solo portal (portal)
pnpm --filter portal dev
```

## Base de Datos

El esquema completo está documentado en `packages/database/schema.sql`.
Para aplicar cambios, usar el SQL Editor en el Supabase Dashboard.

## Roles de Usuario

| Rol | Descripción |
|---|---|
| `student` | Alumno. Solo accede a `class`. |
| `teacher` | Profesor. Accede a `class` y `portal`. |
| `admin` | Administrador. Acceso total. |
