import { Request, Response } from 'express'
import UnauthenticatedError from '../errors/unauthentication_error'
import UserSchema, { IUser } from '../models/Users'
import { StatusCodes } from 'http-status-codes'
import { OAuth2Client } from 'google-auth-library'

const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_OAUTH2_CLIENT_ID,
  process.env.GOOGLE_OAUTH2_CLIENT_SECRET,
  'postmessage'
)

const googleLogin = async (req: Request, res: Response): Promise<void> => {
  const { code } = req.body
  if (!code) throw new UnauthenticatedError('Provide code.')

  const { tokens } = await oAuth2Client.getToken(code)
  console.log('google tokens', tokens)

  const userInfo = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
    },
  })
    .then((res) => res.json())
    .then((res) => res)
    .catch((err) => {
      console.log(err)
      throw new UnauthenticatedError('Not authorized to access.')
    })
  console.log(userInfo)

  const email = userInfo.email.toLocaleLowerCase()
  if (!email) throw new UnauthenticatedError('Not authorized to access.')

  let user: IUser | null = await UserSchema.findOne({ email })
  if (!user) {
    user = new UserSchema({
      name: userInfo.name,
      email,
      password: crypto.randomUUID(), // random password for OAuth users
      imageURL: userInfo.picture,
    })
    await user.save()
  }

  // generate JWT token and response.
  const token = user.createJWT()
  const expiresIn = process.env.JWT_EXPIRES_IN || 3000
  res.cookie('token', token, {
    maxAge: parseInt(`${expiresIn}`) * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV == 'production',
    sameSite: 'strict',
  })
  res.status(StatusCodes.OK).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    imageURL: user.imageURL,
    token,
  })
}

export { googleLogin }
