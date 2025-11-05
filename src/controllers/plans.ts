import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import PlanSchema, { IPlan } from '../models/Plans'
import PlaceSchema from '../models/Places'
import CitySchema from '../models/Cities'
import BookmarkSchema from '../models/Bookmarks'
import UserSchema, { IUser } from '../models/Users'
import NotFoundError from '../errors/not_found'
import { geoJsonToCoords } from '../utils/location'
import { attachBookmarkFlagToPlans } from './util'
import CustomAPIError from '../errors/custom_error'

const PAGE_SIZE = 10
const PLANS_MAX_LIMIT = 40

const fetchAllPlans = async (req: Request, res: Response) => {
  const { search, cityId, page = '1', size = PAGE_SIZE } = req.query

  const filters = {
    ...(search && {
      title: { $regex: search, $options: 'i' },
    }),
    ...(cityId && { 'cities.placeId': cityId }),
  }

  const pageSize: number = parseInt(size as string)
  const pageNumber: number = (parseInt(page as string) - 1) * pageSize

  const totalItems = await PlanSchema.countDocuments(filters)
  const pagesCount = Math.ceil(totalItems / pageSize)

  const plans = await PlanSchema.find(filters)
    .select('title images cities stopCount type rate reviewCount startLocation finishLocation distance duration')
    .populate('userId', 'name')
    .skip(pageNumber)
    .limit(pageSize)
    .lean()

  const authenticatedUserId = req.user ? req.user.userId : ''
  const plansWithBookmarksStatus = await attachBookmarkFlagToPlans(plans, authenticatedUserId)

  res.status(StatusCodes.OK).json({
    ...{ search, cityId },
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
    .select(
      'title description images cities stopCount stops polyline type rate reviewCount startLocation finishLocation distance duration createdAt updatedAt'
    )
    .populate('userId', 'name imageURL')
    .lean()

  if (!plan) throw new CustomAPIError(`Plan not found with the id ${planId}`, StatusCodes.NOT_FOUND)

  // Get all cityIDs of stops in an array
  const cityIds = plan?.cities.map((c) => c.placeId)
  // Select all cities by the ids
  const unorderedCities = await CitySchema.find({
    placeId: { $in: cityIds },
  })
    .select('placeId name state country imageURL location viewport plans')
    .lean()

  // Make sure the order of cities is the same as plan.cities
  const cities = plan?.cities.map((city) => {
    const res = unorderedCities.find((c) => city.placeId === c.placeId)
    return {
      ...res,
      location: geoJsonToCoords(res?.location),
    }
  })

  // Get all placeIDs of stops in an array
  const placeIds = plan?.stops.map((stop) => stop.placeId)
  // Select all places by the ids
  const unorderedPlaces = await PlaceSchema.find({
    placeId: { $in: placeIds },
  })
    .select(
      'placeId name state country address summary imageURL location type rating userRatingCount reviewSummary directionGoogleURI placeGoogleURI'
    )
    .lean()

  // Make sure the order of places is the same as plan.stops
  const places = plan?.stops.map((stop) => {
    const res = unorderedPlaces.find((place) => stop.placeId === place.placeId)
    return {
      ...res,
      location: geoJsonToCoords(res?.location),
    }
  })

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
    cities: cities,
    stops: places,
    isBookmarked,
    startLocation: geoJsonToCoords(plan.startLocation),
    finishLocation: geoJsonToCoords(plan.finishLocation),
  })
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
    .select('title images cities stopCount type rate reviewCount startLocation finishLocation distance duration')
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

export { fetchAllPlans, fetchPlan, fetchUserWithPlans, fetchAllNearbyPlans }
