import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

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
