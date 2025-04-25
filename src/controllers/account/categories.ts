import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import CategorySchema, { ICategory } from '../../models/Categories'

const fetchAllCategories = async (req: Request, res: Response) => {
  if (!req.user) throw new Error('Not authorized to access.')
  console.log('fetch all categories')
  const categories = await CategorySchema.find()

  res.status(StatusCodes.OK).json(categories)
}

const createNewCategory = async (req: Request, res: Response) => {
  if (!req.user) throw new Error('Not authorized to access.')

  const userId: string = req.user.userId

  const createdCategory: ICategory = await CategorySchema.create({
    ...req.body,
    userId,
  })

  if (!createdCategory) throw new Error('Failed to create category')

  res.status(StatusCodes.CREATED).json(createdCategory)
}

export { fetchAllCategories, createNewCategory }
