import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import { MongoServerError } from 'mongodb'
import CustomAPIError from '../errors/custom_error'

const errorHandlerMiddleware = (err: unknown, req: Request, res: Response) => {
  // Set default or set by custom error's values
  let customError = {
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    msg: 'Something went wrong.',
  }

  if (err instanceof CustomAPIError) {
    customError = {
      statusCode: err.statusCode || customError.statusCode,
      msg: err.message || customError.msg,
    }
  }

  // Check if error comes from Mongoose and which error code is
  // Mongoose cast error
  if (err instanceof mongoose.Error.CastError) {
    customError = {
      statusCode: StatusCodes.NOT_FOUND,
      msg: `Item not found with the id: ${err.value}`,
    }
  }
  // Mongoose validation error
  if (err instanceof mongoose.Error.ValidationError) {
    customError = {
      statusCode: StatusCodes.BAD_REQUEST,
      msg: `${Object.values(err.errors)
        .map((item) => item.message)
        .join(', ')}`,
    }
  }
  // Mongoose duplicate error
  if (err instanceof MongoServerError && err.code === 11000) {
    customError = {
      statusCode: StatusCodes.BAD_REQUEST,
      msg: `Duplicate value entered for unique '${Object.keys(err.keyValue)[0]}' field, please use different value.`,
    }
  }

  res.status(customError.statusCode).json({ msg: customError.msg })
}

export default errorHandlerMiddleware
