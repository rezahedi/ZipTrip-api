import { Request, Response, NextFunction } from 'express'

const authMiddleware = async (request: Request, response: Response, next: NextFunction) => {
  // TODO: Get payload out of token
  // TODO: Fetch user's detail from database
  // TODO: Return user's detail as request.user

  // FIXME: This below code should replace with real user's data
  // Populated request.user with fake user for now
  request.user = {
    userId: '67fdfdfcd9c143f362fb9701',
    name: 'Reza',
    email: 'reza@example.com',
    token: 'some-fake-token-sdfjsdkfjoweifjsodlf',
  }

  next()
}

export default authMiddleware
