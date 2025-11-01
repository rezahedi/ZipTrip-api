import { Request, Response, NextFunction } from 'express'
import { connectDB } from '../db/connection'
import { loadEnv } from '../utils/loadEnv'
loadEnv()

const authMiddleware = async (request: Request, response: Response, next: NextFunction) => {
  await connectDB(`${process.env.MONGO_URI}`)
  next()
}

export default authMiddleware
