import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import BookmarkSchema from '../../models/Bookmarks'
import PlanSchema from '../../models/Plans'
import CustomAPIError from '../../errors/custom_error'

const PAGE_SIZE = 10

const fetchAllBookmarkedPlans = async (req: Request, res: Response) => {
  if (!req.user) throw new CustomAPIError('Not authorized to access.', StatusCodes.UNAUTHORIZED)

  const { page = 1, size = PAGE_SIZE } = req.query

  const userId = req.user.userId

  const filters = {
    _id: {
      $in: await BookmarkSchema.find({
        userId,
      }).distinct('planId'),
    },
  }

  const pageSize: number = parseInt(size as string)
  const pageNumber: number = (parseInt(page as string) - 1) * pageSize

  const totalItems = await PlanSchema.countDocuments(filters)
  const pagesCount = Math.ceil(totalItems / pageSize)

  const bookmarkedPlans = await PlanSchema.find(filters)
    .populate('categoryId', 'name')
    .populate('userId', 'name')
    .skip(pageNumber)
    .limit(pageSize)

  res.status(StatusCodes.OK).json({
    page: pageNumber,
    size: pageSize,
    pagesCount,
    items: bookmarkedPlans,
  })
}

const addBookmark = async (req: Request, res: Response) => {
  if (!req.user) throw new CustomAPIError('Not authorized to access.', StatusCodes.UNAUTHORIZED)

  const userId = req.user.userId
  const { planId } = req.params

  // Check if the plan exists
  await PlanSchema.findById(planId)

  // Create a new bookmark
  await BookmarkSchema.create({
    userId,
    planId,
  })

  res.status(StatusCodes.CREATED).end()
}

const removeBookmark = async (req: Request, res: Response) => {
  if (!req.user) throw new CustomAPIError('Not authorized to access.', StatusCodes.UNAUTHORIZED)

  const userId = req.user.userId
  const { planId } = req.params

  const result = await BookmarkSchema.findOneAndDelete({
    userId,
    planId,
  })

  if (!result) {
    throw new CustomAPIError(`No bookmarked plan with id ${planId}`, StatusCodes.NOT_FOUND)
  }

  res.status(StatusCodes.NO_CONTENT).end()
}

export { fetchAllBookmarkedPlans, addBookmark, removeBookmark }
