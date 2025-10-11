import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import PlanSchema from '../../models/Plans'
import BadRequestError from '../../errors/bad_request'
import { v2 as cloudinary } from 'cloudinary'
import CustomAPIError from '../../errors/custom_error'

const MAX_IMAGE_SIZE = 1000000 // 1MB

const addImageToPlan = async (req: Request, res: Response) => {
  const { planId } = req.params
  const image = req.file

  if (!image) {
    throw new BadRequestError('single image file is required')
  }

  const plan = await PlanSchema.findById(planId).orFail(new BadRequestError('Plan not found'))

  // Check image type and size
  if (!image.mimetype.startsWith('image/')) {
    throw new BadRequestError('Invalid image format')
  }
  if (image.size > MAX_IMAGE_SIZE) {
    throw new BadRequestError('Image size should be less than 1MB')
  }

  const base64 = `data:${image.mimetype};base64,${image.buffer.toString('base64')}`
  const { secure_url: imageURL } = await cloudinary.uploader.upload(base64, {
    folder: 'ZipTrip/Plans',
    overwrite: true,
    invalidate: true,
    // transformation: [{ width: 200, height: 200, gravity: 'face', crop: 'thumb' }],
  })

  if (!imageURL) {
    throw new CustomAPIError('Failed to upload image', StatusCodes.INTERNAL_SERVER_ERROR)
  }

  plan.images.push(imageURL)
  await plan.save()

  res.status(StatusCodes.OK).json({ imageURL })
}

export { addImageToPlan }
