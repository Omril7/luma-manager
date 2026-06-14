import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Known storage limits per plan name (bytes). Used when the API omits storage.limit.
const PLAN_STORAGE_LIMITS: Record<string, number> = {
  'Free': 25 * 1024 * 1024 * 1024,
}

export type CloudinaryUsage = {
  plan: string
  storage_bytes: number
  storage_limit: number  // 0 = truly unknown
  bandwidth_bytes: number
  resources: number
  credits_used: number
  credits_limit: number  // 0 = unknown
}

export async function getUsage(): Promise<CloudinaryUsage | null> {
  try {
    const result = await cloudinary.api.usage()
    const plan: string = result.plan ?? ''
    const storageLimit: number =
      result.storage?.limit ?? PLAN_STORAGE_LIMITS[plan] ?? 0

    return {
      plan,
      storage_bytes: result.storage?.usage ?? 0,
      storage_limit: storageLimit,
      bandwidth_bytes: result.bandwidth?.usage ?? 0,
      resources: result.resources ?? 0,
      credits_used: result.credits?.usage ?? 0,
      credits_limit: result.credits?.limit ?? 0,
    }
  } catch {
    return null
  }
}

export async function deleteFile(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' })
}

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  folder = 'luma-manager/receipts'
): Promise<{ public_id: string; secure_url: string; resource_type: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: filename, resource_type: 'auto' },
      (error, result) => {
        if (error || !result) return reject(error)
        resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
          resource_type: result.resource_type,
        })
      }
    )
    stream.end(buffer)
  })
}
