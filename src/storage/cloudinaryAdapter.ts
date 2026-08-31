import type { Adapter, GeneratedAdapter } from '@payloadcms/plugin-cloud-storage/types'
import { v2 as cloudinary } from 'cloudinary'
import type { UploadApiResponse } from 'cloudinary'
import { Readable } from 'node:stream'

const DEFAULT_FOLDER = 'kaprichos'

export function getCloudinaryEnv() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME || ''
  const api_key = process.env.CLOUDINARY_API_KEY || ''
  const api_secret = process.env.CLOUDINARY_API_SECRET || ''
  const folder = process.env.CLOUDINARY_FOLDER || DEFAULT_FOLDER

  return { cloud_name, api_key, api_secret, folder }
}

export function isCloudinaryConfigured() {
  const { cloud_name, api_key, api_secret } = getCloudinaryEnv()
  return Boolean(cloud_name && api_key && api_secret)
}

function configureCloudinary() {
  const { cloud_name, api_key, api_secret } = getCloudinaryEnv()

  if (!cloud_name || !api_key || !api_secret) {
    throw new Error(
      'Faltan CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY o CLOUDINARY_API_SECRET. Las imágenes no se pueden guardar en Vercel Hobby.',
    )
  }

  cloudinary.config({ cloud_name, api_key, api_secret, secure: true })
}

function publicIdFromFilename(filename: string) {
  return filename.replace(/\.[^/.]+$/, '')
}

function folderFromPrefix(prefix?: string) {
  return prefix || getCloudinaryEnv().folder
}

export function cloudinaryFileUrl(filename: string, prefix?: string) {
  configureCloudinary()
  return cloudinary.url(`${folderFromPrefix(prefix)}/${publicIdFromFilename(filename)}`, {
    secure: true,
    resource_type: 'image',
  })
}

export const cloudinaryAdapter: Adapter = ({ prefix }): GeneratedAdapter => ({
  name: 'cloudinary',
  generateURL: ({ filename, prefix: prefixFromDoc }) =>
    cloudinaryFileUrl(filename, prefixFromDoc || prefix),
  async handleUpload({ file }) {
    configureCloudinary()
    const folder = folderFromPrefix(prefix)

    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicIdFromFilename(file.filename),
          resource_type: 'image',
          overwrite: true,
          unique_filename: false,
          use_filename: true,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error('Cloudinary no devolvió resultado de upload'))
            return
          }
          resolve(result)
        },
      )

      Readable.from(file.buffer).pipe(uploadStream)
    })

    return {
      url: uploadResult.secure_url,
    }
  },
  async handleDelete({ filename, doc }) {
    configureCloudinary()
    const publicId = `${folderFromPrefix(doc.prefix || prefix)}/${publicIdFromFilename(filename)}`
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
  },
  staticHandler: async (_req, { params }) => {
    return Response.redirect(cloudinaryFileUrl(params.filename, params.prefix || prefix), 302)
  },
})
