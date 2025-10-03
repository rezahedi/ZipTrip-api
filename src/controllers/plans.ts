import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import PlanSchema, { IPlan } from '../models/Plans'
import BookmarkSchema from '../models/Bookmarks'
import UserSchema, { IUser } from '../models/Users'
import CategorySchema, { ICategory } from '../models/Categories'
import NotFoundError from '../errors/not_found'
import { geoJsonToCoords } from '../utils/location'

const PAGE_SIZE = 10
const PLANS_MAX_LIMIT = 40

const fetchAllPlans = async (req: Request, res: Response) => {
  const { search, categoryId, page = '1', size = PAGE_SIZE } = req.query

  const filters = {
    ...(search && {
      title: { $regex: search, $options: 'i' },
    }),
    ...(categoryId && { categoryId }),
  }

  const pageSize: number = parseInt(size as string)
  const pageNumber: number = (parseInt(page as string) - 1) * pageSize

  const totalItems = await PlanSchema.countDocuments(filters)
  const pagesCount = Math.ceil(totalItems / pageSize)

  const plans = await PlanSchema.find(filters)
    .select('title images stopCount type rate reviewCount startLocation finishLocation distance duration')
    .populate('categoryId', 'name')
    .populate('userId', 'name')
    .skip(pageNumber)
    .limit(pageSize)
    .lean()

  const authenticatedUserId = req.user ? req.user.userId : ''
  const plansWithBookmarksStatus = await attachBookmarkFlagToPlans(plans, authenticatedUserId)

  res.status(StatusCodes.OK).json({
    ...{ search, categoryId },
    page: parseInt(page as string),
    size: pageSize,
    pagesCount,
    // TODO: it's not efficient, may combine with attachBookmarkFlagToPlans loop!
    items: plansWithBookmarksStatus.map((item) => ({
      ...item,
      startLocation: geoJsonToCoords(item.startLocation),
      finishLocation: geoJsonToCoords(item.finishLocation),
    })),
  })
}

const fetchUserWithPlans = async (req: Request, res: Response) => {
  const { userId } = req.params
  const { page = '1', size = PAGE_SIZE } = req.query

  const pageSize: number = parseInt(size as string)
  const pageNumber: number = (parseInt(page as string) - 1) * pageSize

  const user: IUser | null = await UserSchema.findById(userId)
    .orFail(new NotFoundError(`Item not found with the id: ${userId}`))
    .select('name imageURL')
    .lean()

  const filters = {
    userId,
  }

  const plans = await PlanSchema.find(filters)
    .select('title images stopCount type rate reviewCount startLocation finishLocation distance duration')
    .populate('categoryId', 'name')
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

const fetchCategoryWithPlans = async (req: Request, res: Response) => {
  const { categoryId } = req.params
  const { page = '1', size = PAGE_SIZE } = req.query

  const pageSize: number = parseInt(size as string)
  const pageNumber: number = (parseInt(page as string) - 1) * pageSize

  const category: ICategory | null = await CategorySchema.findById(categoryId)
    .orFail(new NotFoundError(`Item not found with the id: ${categoryId}`))
    .lean()

  const filters = {
    categoryId,
  }

  const plans = await PlanSchema.find(filters)
    .select('title images stopCount type rate reviewCount startLocation finishLocation distance duration')
    .populate('categoryId', 'name')
    .populate('userId', 'name')
    .skip(pageNumber)
    .limit(pageSize)
    .lean()

  const authenticatedUserId = req.user ? req.user.userId : ''
  const plansWithBookmarksStatus = await attachBookmarkFlagToPlans(plans, authenticatedUserId)

  const totalItems = await PlanSchema.countDocuments(filters)
  const pagesCount = Math.ceil(totalItems / pageSize)

  res.status(StatusCodes.OK).json({
    ...category,
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

const fetchPlan = async (req: Request, res: Response) => {
  const { planId } = req.params

  const plan: IPlan | null = await PlanSchema.findById(planId)
    .orFail(new NotFoundError(`Item not found with the id: ${planId}`))
    .select(
      'title description images stopCount stops type rate reviewCount startLocation finishLocation distance duration createdAt updatedAt'
    )
    .populate('categoryId', 'name imageURL')
    .populate('userId', 'name imageURL')
    .lean()

  // if (!plan) return new NotFoundError(`Item not found with the id: ${planId}`)

  const loggedInUser = req.user || null
  let isBookmarked: boolean = false
  if (loggedInUser) {
    const res = await BookmarkSchema.exists({
      userId: loggedInUser.userId,
      planId,
    }).lean()
    if (res) {
      isBookmarked = true
    }
  }

  res.status(StatusCodes.OK).json({
    ...plan,
    isBookmarked,
    startLocation: geoJsonToCoords(plan?.startLocation),
    finishLocation: geoJsonToCoords(plan?.finishLocation),
  })
}

const fetchAllCategories = async (req: Request, res: Response) => {
  const categories = await CategorySchema.find().lean()
  res.status(StatusCodes.OK).json(categories)
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

const fetchAllNearbyPlans = async (req: Request, res: Response) => {
  // TODO: get bounding box details from params
  // TODO: query and get plans inside the bounding box geo location

  const { latmin, lngmin, latmax, lngmax } = req.query

  const withinBoundingBox = {
    type: 'Polygon',
    coordinates: [
      [
        [lngmin, latmin],
        [lngmin, latmax],
        [lngmax, latmax],
        [lngmax, latmin],
        [lngmin, latmin], // close the square
      ],
    ],
  }

  const plans = await PlanSchema.find({
    startLocation: {
      $geoWithin: {
        $geometry: withinBoundingBox,
      },
    },
  })
    .limit(PLANS_MAX_LIMIT)
    .select('title images stopCount type rate reviewCount startLocation finishLocation distance duration')
    .populate('categoryId', 'name')
    .populate('userId', 'name')
    .lean()

  const authenticatedUserId = req.user ? req.user.userId : ''
  const plansWithBookmarksStatus = await attachBookmarkFlagToPlans(plans, authenticatedUserId)

  res.status(StatusCodes.OK).json({
    count: plansWithBookmarksStatus.length,
    items: plansWithBookmarksStatus.map((item) => ({
      ...item,
      startLocation: geoJsonToCoords(item.startLocation),
      finishLocation: geoJsonToCoords(item.finishLocation),
    })),
  })
}

export { fetchAllPlans, fetchPlan, fetchUserWithPlans, fetchCategoryWithPlans, fetchAllCategories, fetchAllNearbyPlans }
