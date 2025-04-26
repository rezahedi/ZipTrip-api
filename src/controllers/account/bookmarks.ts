import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import BookmarkSchema from '../../models/Bookmarks'
import PlanSchema from '../../models/Plans'
import CustomAPIError from '../../errors/custom_error'

const fetchAllBookmarkedPlans = async (req: Request, res: Response) => {
  if (!req.user) throw new CustomAPIError('Not authorized to access.', StatusCodes.UNAUTHORIZED)

  const userId = req.user.userId

  const filters = {
    _id: {
      $in: await BookmarkSchema.find({
        userId,
      }).distinct('planId'),
    },
  }

  // TODO: Add pagination support later

  const bookmarkedPlans = await PlanSchema.find(filters).populate('categoryId', 'name').populate('userId', 'name')

  res.status(StatusCodes.OK).json({
    page: 1,
    size: 10,
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
