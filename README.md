# Kaprichos

Tienda online con Next.js, Payload CMS 3.x, Mercado Pago, Supabase (Postgres) y Cloudinary. Pensada para desplegarse en el plan Hobby de Vercel.

## Requisitos

- Node.js 20.9 o superior
- Cuentas gratuitas: [Supabase](https://supabase.com), [Cloudinary](https://cloudinary.com), [GitHub](https://github.com), [Vercel](https://vercel.com)

```bash
npm install
cp .env.example .env.local
```

Completá `.env.local` con las claves de abajo y después:

```bash
npm run dev
```

- Tienda: http://localhost:3000
- CMS: http://localhost:3000/admin (el primer usuario que crees será el administrador)

---

## 1. Supabase (plan Free)

Payload usa Postgres. En el plan free de Supabase alcanza para arrancar (500 MB).

1. Entrá a [supabase.com/dashboard](https://supabase.com/dashboard) y creá un proyecto (región **South America East / São Paulo** si está disponible: menor latencia desde Argentina).
2. Guardá la **database password** que te muestra al crear el proyecto.
3. Andá a **Project Settings → Database → Connection string**.
4. Copiá la URI del **Session pooler** (puerto **5432**) y agregá `?sslmode=require` al final si no viene:

```text
postgresql://postgres.TU_REF:TU_PASSWORD@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

5. Pegala en `DATABASE_URI` (`.env.local` y en Vercel). En local se usa el puerto 5432 (hace falta para `push` de esquema). **En Vercel la app cambia sola el puerto a 6543** (Transaction pooler), que es el modo que funciona con lambdas.

El plan free limita el Session pooler a **15 sesiones**. Si ves `timeout exceeded when trying to connect` o `EMAXCONNSESSION`:

- Cerrá `npm run dev` en tu PC (local y Vercel comparten la misma base).
- Esperá ~1 minuto a que Supabase suelte las sesiones.
- Confirmá en los logs de Vercel la línea `[kaprichos:db] pooler ...:6543`.

No hace falta el cliente JS de Supabase: Payload habla directo con Postgres.

Si el proyecto free se pausa por inactividad, reactivarlo desde el dashboard de Supabase.

---

## 2. Cloudinary (plan Free)

Las imágenes **no** se guardan en Vercel (el plan Hobby no sirve para archivos). Van a Cloudinary (25 GB / 25 créditos mensuales en free).

1. Creá una cuenta en [cloudinary.com](https://cloudinary.com).
2. En el Dashboard copiá **Cloud name**, **API Key** y **API Secret**.
3. Cargá en `.env.local`:

```env
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=kaprichos
```

4. Subí una foto desde `/admin` → Media. Tiene que aparecer en Cloudinary → Media Library, carpeta `kaprichos`.

Sin estas tres variables, Payload cae a almacenamiento local (no sirve en Vercel).

---

## 3. GitHub + Vercel (Hobby)

### Subir el código a GitHub

En GitHub: **New repository** → nombre `kaprichos` → **Private** (recomendado) → **no** inicialices con README.

En esta carpeta:

```bash
git remote add origin https://github.com/TU_USUARIO/kaprichos.git
git branch -M main
git push -u origin main
```

### Variables en Vercel

En [vercel.com](https://vercel.com) → **Add New → Project** → importá el repo. Framework: Next.js. **Antes de Deploy**, en Environment Variables cargá (Production + Preview):

| Variable | Valor |
| --- | --- |
| `DATABASE_URI` | URI del **Session pooler** de Supabase (puerto 5432). En runtime Vercel la app la pasa a 6543. |
| `PAYLOAD_SECRET` | El mismo secret de 32+ caracteres que en local |
| `NEXT_PUBLIC_SERVER_URL` | `https://tu-proyecto.vercel.app` (actualizalo después del primer deploy si el dominio cambia) |
| `NEXT_PUBLIC_WEBHOOK_URL` | La misma URL de Vercel, **sin** barra final |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary |
| `CLOUDINARY_API_KEY` | Cloudinary |
| `CLOUDINARY_API_SECRET` | Cloudinary |
| `CLOUDINARY_FOLDER` | `kaprichos` |
| `MERCADOPAGO_ACCESS_TOKEN` | Token de Mercado Pago |

Deploy. El webhook de Mercado Pago queda en:

`https://tu-proyecto.vercel.app/api/webhooks/mercadopago`

Después del primer deploy, si la URL no era la definitiva, actualizá `NEXT_PUBLIC_SERVER_URL` y `NEXT_PUBLIC_WEBHOOK_URL` y volvé a desplegar.

---

## Scripts

| Comando | Uso |
| --- | --- |
| `npm run dev` | Desarrollo |
| `npm run build` | Build de producción |
| `npm run generate:types` | Tipos de Payload |
| `npm run generate:importmap` | Import map del admin |
