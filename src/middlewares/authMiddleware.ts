import { Request, Response, NextFunction } from 'express'

const authMiddleware = async (request: Request, response: Response, next: NextFunction) => {
  // TODO: Authentication logic here

  // TODO: This below code should replace with real authentication
  // FIXME: Populate request.user with fake user for now
  request.user = {
    userId: '67c636912f64a2dedb34726d',
    name: 'Reza Fake',
    email: 'reza@fake.com',
    token: 'some-fake-token-sdfjsdkfjoweifjsodlf',
  }

  next()
}

export default authMiddleware
