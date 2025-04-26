import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import BookmarkSchema from '../../models/Bookmarks'
import PlanSchema from '../../models/Plans'

const fetchAllBookmarkedPlans = async (req: Request, res: Response) => {
  if (!req.user) throw new Error('Not authorized to access.')

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

const bookmarkPlan = async (req: Request, res: Response) => {
  if (!req.user) throw new Error('Not authorized to access.')

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

export { fetchAllBookmarkedPlans, bookmarkPlan }
