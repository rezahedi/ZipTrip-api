import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import BookmarkSchema, { IBookmark } from '../../models/Bookmarks'
import PlanSchema from '../../models/Plans'

const fetchAllBookmarkedPlans = async (req: Request, res: Response) => {
  if (!req.user) throw new Error('Not authorized to access.')

  const bookmarks = await BookmarkSchema.find({ userId: req.user.userId })

  res.status(StatusCodes.OK).json(bookmarks)
}

const bookmarkPlan = async (req: Request, res: Response) => {
  if (!req.user) throw new Error('Not authorized to access.')

  const { planId } = req.params

  // Check if the plan exists
  await PlanSchema.findById(planId)

  // Create a new bookmark
  const newBookmark: IBookmark = await BookmarkSchema.create({
    userId: req.user.userId,
    planId,
  })

  res.status(StatusCodes.CREATED).json(newBookmark)
}

export { fetchAllBookmarkedPlans, bookmarkPlan }
