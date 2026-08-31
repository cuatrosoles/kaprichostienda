import type { Adapter, GeneratedAdapter } from '@payloadcms/plugin-cloud-storage/types'
import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'node:stream'

const DEFAULT_FOLDER = 'kaprichos'

function getFolder(prefix?: string) {
  return prefix || process.env.CLOUDINARY_FOLDER || DEFAULT_FOLDER
}

function toPublicId(filename: string) {
  return filename.replace(/\.[^/.]+$/, '')
}

function ensureCloudinaryConfig() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
}

function buildUrl(filename: string, prefix?: string) {
  ensureCloudinaryConfig()
  return cloudinary.url(`${getFolder(prefix)}/${toPublicId(filename)}`, {
    secure: true,
    resource_type: 'image',
  })
}

export const cloudinaryAdapter: Adapter = ({ prefix }): GeneratedAdapter => ({
  name: 'cloudinary',
  generateURL: ({ filename, prefix: prefixFromDoc }) =>
    buildUrl(filename, prefixFromDoc || prefix),
  async handleUpload({ file }) {
    ensureCloudinaryConfig()
    const folder = getFolder(prefix)

    await new Promise<void>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: toPublicId(file.filename),
          resource_type: 'image',
          overwrite: true,
          unique_filename: false,
          use_filename: true,
        },
        (error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        },
      )

      Readable.from(file.buffer).pipe(uploadStream)
    })
  },
  async handleDelete({ filename, doc }) {
    ensureCloudinaryConfig()
    const publicId = `${getFolder(doc.prefix || prefix)}/${toPublicId(filename)}`
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
  },
  staticHandler: async (_req, { params }) => {
    return Response.redirect(buildUrl(params.filename, prefix), 302)
  },
})
