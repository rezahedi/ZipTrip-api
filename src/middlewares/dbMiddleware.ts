import { Request, Response, NextFunction } from 'express'
import { connectDB } from '../db/connection'
import { loadEnv } from '../utils/loadEnv'
import { StatusCodes } from 'http-status-codes'
import CustomAPIError from '../errors/custom_error'
loadEnv()

const authMiddleware = async (request: Request, response: Response, next: NextFunction) => {
  if (!process.env.MONGO_URI) {
    throw new CustomAPIError(
      'Database connection string is undefined. Check your environment variables.',
      StatusCodes.INTERNAL_SERVER_ERROR
    )
  }

  await connectDB(`${process.env.MONGO_URI}`)
  next()
}

export default authMiddleware
