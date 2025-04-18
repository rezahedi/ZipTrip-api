import { Request, Response, NextFunction } from 'express'

const authMiddleware = async (request: Request, response: Response, next: NextFunction) => {
  const authHeader = request.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // FIXME: Replace below response with custom error handler
    response.status(401).json({ error: 'Authentication not provided' })
    return
  }

  const token = authHeader.split(' ')[1]

  if (token !== 'fake-temporary-token') {
    // FIXME: Replace below response with custom error handler
    response.status(401).json({ error: 'Invalid token' })
    return
  }

  // TODO: Get payload out of token
  // TODO: Fetch user's detail from database
  // TODO: Return user's detail as request.user

  // FIXME: This below code should replace with real user's data
  // Populated request.user with fake user for now
  request.user = {
    userId: '67fdfdfcd9c143f362fb9701',
    name: 'Reza',
    email: 'reza@example.com',
    token: 'fake-temporary-token',
  }

  next()
}

export default authMiddleware
