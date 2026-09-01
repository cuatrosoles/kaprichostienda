import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import path from 'path'
import { buildConfig } from 'payload'
import { es } from 'payload/i18n/es'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Products } from './collections/Products'
import { Orders } from './collections/Orders'
import { Categories } from './collections/Categories'
import { Coupons } from './collections/Coupons'
import { Customers } from './collections/Customers'
import { StoreSettings } from './globals/StoreSettings'
import { HomeHero } from './globals/HomeHero'
import { storeEmailAdapter } from './email/storeEmailAdapter'
import {
  cloudinaryAdapter,
  cloudinaryFileUrl,
  getCloudinaryEnv,
  isCloudinaryConfigured,
} from './storage/cloudinaryAdapter'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

function getDatabaseUri() {
  const uri = process.env.DATABASE_URI || ''
  if (!uri) return ''
  if (uri.includes('uselibpqcompat=')) return uri
  return uri.includes('?')
    ? `${uri}&uselibpqcompat=true`
    : `${uri}?sslmode=require&uselibpqcompat=true`
}

const { folder: cloudinaryFolder } = getCloudinaryEnv()

export default buildConfig({
  admin: {
    user: Users.slug,
    dateFormat: 'dd/MM/yyyy HH:mm',
    importMap: {
      baseDir: path.resolve(dirname),
      importMapFile: path.resolve(dirname, 'app/(cms)/admin/importMap.js'),
    },
    meta: {
      titleSuffix: ' | Kaprichos',
      icons: [
        {
          rel: 'icon',
          type: 'image/webp',
          url: '/logo-kaprichos.webp',
        },
      ],
    },
    components: {
      graphics: {
        Logo: '/graphics/Logo',
        Icon: '/graphics/Icon',
      },
    },
  },
  collections: [Users, Media, Categories, Products, Orders, Coupons, Customers],
  globals: [StoreSettings, HomeHero],
  i18n: {
    fallbackLanguage: 'es',
    supportedLanguages: { es },
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  // Payload llama `email({ payload })` en runtime; el tipo público espera el adapter ya resuelto.
  email: storeEmailAdapter as never,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: getDatabaseUri(),
      max: process.env.VERCEL === '1' ? 3 : 10,
      ssl: {
        rejectUnauthorized: false,
      },
    },
    push: process.env.PAYLOAD_DISABLE_PUSH !== 'true',
  }),
  sharp,
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  plugins: [
    cloudStoragePlugin({
      enabled: isCloudinaryConfigured(),
      collections: {
        media: {
          adapter: cloudinaryAdapter,
          prefix: cloudinaryFolder,
          disableLocalStorage: true,
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) => cloudinaryFileUrl(filename, prefix),
        },
      },
    }),
  ],
})
