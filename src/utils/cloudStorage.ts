import { v2 as cloudinary } from 'cloudinary'

export const uploadImage = async (imageURL: string): Promise<string | null> => {
  if (!imageURL) return null

  const { secure_url } = await cloudinary.uploader.upload(imageURL, {
    folder: 'ZipTrip/Places',
    overwrite: true,
    invalidate: true,
  })
  return secure_url
}
