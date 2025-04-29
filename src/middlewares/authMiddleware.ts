import { Request, Response, NextFunction } from 'express'
import dotenv from 'dotenv'
import UserSchema, { IUser } from '../models/Users'
import jwt, { JwtPayload } from 'jsonwebtoken'
import UnauthenticatedError from '../errors/unauthentication_error'

dotenv.config()
interface MyJwtPayload extends JwtPayload {
  userId: string
  name: string
}

const authMiddleware = async (request: Request, response: Response, next: NextFunction) => {
  const authHeader = request.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthenticatedError('Authentication invalid, please provide a valid token')
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as MyJwtPayload
    console.log('payload', payload);

    // Attach the user to the authorized route
    const user: IUser = await UserSchema.findById(payload.userId)
      .orFail(new UnauthenticatedError('User not found, please login again'))
      .select('-password')
    request.user = { userId: user._id, name: user.name, email: user.email, token }
    next()
  } catch {
    throw new UnauthenticatedError('Authentication invalid, please provide a valid token')
  }
}

export default authMiddleware
