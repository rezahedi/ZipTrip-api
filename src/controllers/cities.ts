import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import CitySchema, { ICity } from '../models/Cities'
import PlanSchema, { IPlan } from '../models/Plans'
import BookmarkSchema from '../models/Bookmarks'
import NotFoundError from '../errors/not_found'
import { geoJsonToCoords } from '../utils/location'

const PAGE_SIZE = 10

const fetchAllCities = async (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({ msg: 'list of cities by different filters' })
}

const fetchCityWithPlans = async (req: Request, res: Response) => {
  const { cityId } = req.params
  const { page = '1', size = PAGE_SIZE } = req.query

  const pageSize: number = parseInt(size as string)
  const pageNumber: number = (parseInt(page as string) - 1) * pageSize

  const user: ICity | null = await CitySchema.findOne({ placeId: cityId })
    .orFail(new NotFoundError(`Item not found with the id: ${cityId}`))
    .select('placeId name imageURL locations plans')
    .lean()

  const filters = {
    'cities.placeId': cityId,
  }

  const plans = await PlanSchema.find(filters)
    .select('title images cities stopCount type rate reviewCount startLocation finishLocation distance duration')
    .populate('userId', 'name')
    .skip(pageNumber)
    .limit(pageSize)
    .lean()

  const authenticatedUserId = req.user ? req.user.userId : ''
  const plansWithBookmarksStatus = await attachBookmarkFlagToPlans(plans, authenticatedUserId)

  const totalItems = await PlanSchema.countDocuments(filters)
  const pagesCount = Math.ceil(totalItems / pageSize)

  res.status(StatusCodes.OK).json({
    ...user,
    location: geoJsonToCoords(user?.location),
    plans: {
      page: parseInt(page as string),
      size: pageSize,
      pagesCount,
      // TODO: it's not efficient, may combine with attachBookmarkFlagToPlans loop!
      items: plansWithBookmarksStatus.map((item) => ({
        ...item,
        startLocation: geoJsonToCoords(item.startLocation),
        finishLocation: geoJsonToCoords(item.finishLocation),
      })),
    },
  })
}

const attachBookmarkFlagToPlans = async (plans: IPlan[], userId: string) => {
  if (!userId)
    return plans.map((plan) => ({
      ...plan,
      isBookmarked: false,
    }))

  // Extract only plan IDs
  const planIds = plans.map((plan) => plan._id)

  // Get plan IDs from bookmarks collection based on userId
  const bookmarks = await BookmarkSchema.find({
    userId,
    planId: { $in: planIds },
  }).select('planId')

  // Create a Set for fast lookup
  const bookmarkedPlanIds = new Set(bookmarks.map((b) => b.planId.toString()))

  // Attach isBookmarked state to each plan
  return plans.map((plan) => ({
    ...plan,
    isBookmarked: bookmarkedPlanIds.has(plan._id.toString()),
  }))
}

export { fetchAllCities, fetchCityWithPlans }
