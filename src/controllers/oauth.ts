import { Request, Response } from 'express'
import UnauthenticatedError from '../errors/unauthentication_error'
import UserSchema, { IUser } from '../models/Users'
import { StatusCodes } from 'http-status-codes'
import { OAuth2Client } from 'google-auth-library'

const client = new OAuth2Client(
  process.env.GOOGLE_OAUTH2_CLIENT_ID,
  process.env.GOOGLE_OAUTH2_CLIENT_SECRET,
  'postmessage'
)

const googleLogin = async (req: Request, res: Response): Promise<void> => {
  const { code } = req.body
  if (!code) throw new UnauthenticatedError('Provide code.')

  const ticket = await client.verifyIdToken({
    idToken: code,
    audience: process.env.GOOGLE_OAUTH2_CLIENT_ID,
  })

  const payload = ticket.getPayload()
  if (!payload) throw new UnauthenticatedError('Invalid token.')

  let user: IUser | null = await UserSchema.findOne({ email: payload.email })
  if (!user) {
    user = new UserSchema({
      name: payload.name,
      email: payload.email,
      password: crypto.randomUUID(), // random password for OAuth users
      imageURL: payload.picture,
    })
    await user.save()
  }

  // generate JWT token and response.
  const { token, expiresIn } = user.createJWT()

  res.status(StatusCodes.OK).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    imageURL: user.imageURL,
    token,
    expiresIn,
  })
}

export { googleLogin }
