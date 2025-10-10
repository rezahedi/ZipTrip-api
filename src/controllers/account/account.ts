import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import PlanSchema, { IPlan } from '../../models/Plans'
import BookmarkSchema from '../../models/Bookmarks'
import PlaceSchema, { IPlace } from '../../models/Places'
import CustomAPIError from '../../errors/custom_error'
import NotFoundError from '../../errors/not_found'
import UnauthenticatedError from '../../errors/unauthentication_error'
import { coordsToGeoJson, geoJsonToCoords } from '../../utils/location'

type PlaceDTO = Omit<IPlace, 'location' | 'createdAt' | 'updatedAt'> & {
  location: [number, number]
}

const PAGE_SIZE = 10

const fetchAllPlans = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthenticatedError('Not authorized to access.')

  const { page = '1', size = PAGE_SIZE } = req.query

  const filters = {
    userId: req.user.userId,
  }

  const pageSize: number = parseInt(size as string)
  const pageNumber: number = (parseInt(page as string) - 1) * pageSize

  const totalItems = await PlanSchema.countDocuments(filters)
  const pagesCount = Math.ceil(totalItems / pageSize)

  const plans = await PlanSchema.find(filters)
    .select('title images stopCount type rate reviewCount startLocation finishLocation distance duration')
    .populate('userId', 'name')
    .skip(pageNumber)
    .limit(pageSize)
    .lean()

  res.status(StatusCodes.OK).json({
    page: parseInt(page as string),
    size: pageSize,
    pagesCount,
    // TODO: it's not efficient, may combine with attachBookmarkFlagToPlans loop!
    items: plans.map((item) => ({
      ...item,
      startLocation: geoJsonToCoords(item.startLocation),
      finishLocation: geoJsonToCoords(item.finishLocation),
    })),
  })
}

const createNewPlan = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthenticatedError('Not authorized to access.')

  const userId: string = req.user.userId
  let { stops, ...plan } = req.body

  if (stops && stops.length > 0) {
    // Insert stops in Places collection if id does not exist
    const ops = stops.map((stop: PlaceDTO) => ({
      updateOne: {
        filter: { placeId: stop.placeId },
        update: {
          $setOnInsert: {
            ...stop,
            location: coordsToGeoJson(stop.location),
          },
        },
        upsert: true, // only insert if not exist
      },
    }))
    await PlaceSchema.bulkWrite(ops)

    plan.stops = stops
    plan.stopCount = stops.length

    plan.startLocation = coordsToGeoJson(stops[0]?.location || [0, 0])
    plan.finishLocation = coordsToGeoJson(stops[stops.length - 1]?.location || [0, 0])
  }

  const createdPlan: IPlan = await PlanSchema.create({
    ...plan,
    userId,
  })

  if (!createdPlan) throw new CustomAPIError('Failed to create plan', StatusCodes.INTERNAL_SERVER_ERROR)

  await createdPlan.populate('userId', 'name')

  res.status(StatusCodes.CREATED).json({
    ...createdPlan.toJSON(),
    startLocation: geoJsonToCoords(createdPlan.startLocation),
    finishLocation: geoJsonToCoords(createdPlan.finishLocation),
  })
}

const fetchPlan = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthenticatedError('Not authorized to access.')

  const userId = req.user.userId
  const planId = req.params.planId

  const plan: IPlan | null = await PlanSchema.findOne({
    userId,
    _id: planId,
  })
    .orFail(new NotFoundError(`No plan with id ${planId}`))
    .select(
      'title description images stopCount stops type rate reviewCount startLocation finishLocation distance duration createdAt updatedAt'
    )
    .populate('userId', 'name')
    .lean()

  res.status(StatusCodes.OK).json({
    ...plan,
    startLocation: geoJsonToCoords(plan?.startLocation),
    finishLocation: geoJsonToCoords(plan?.finishLocation),
  })
}

const updatePlan = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthenticatedError('Not authorized to access.')

  const userId: string = req.user.userId
  const planId = req.params.planId

  let { stops, ...plan } = req.body

  if (stops && stops.length > 0) {
    // Insert stops in Places collection if id does not exist
    const ops = stops.map((stop: PlaceDTO) => ({
      updateOne: {
        filter: { placeId: stop.placeId },
        update: {
          $setOnInsert: {
            ...stop,
            location: coordsToGeoJson(stop.location),
          },
        },
        upsert: true, // only insert if not exist
      },
    }))
    await PlaceSchema.bulkWrite(ops)

    plan.stops = stops
    plan.stopCount = stops.length

    plan.startLocation = coordsToGeoJson(stops[0]?.location || [0, 0])
    plan.finishLocation = coordsToGeoJson(stops[stops.length - 1]?.location || [0, 0])
  }

  const updatedPlan: IPlan | null = await PlanSchema.findByIdAndUpdate(
    {
      _id: planId,
      userId,
    },
    plan,
    {
      new: true,
      runValidators: true,
    }
  ).populate('userId', 'name')

  if (!updatedPlan) throw new CustomAPIError('Failed to update the plan', StatusCodes.INTERNAL_SERVER_ERROR)

  res.status(StatusCodes.CREATED).json({
    ...updatedPlan.toJSON(),
    startLocation: geoJsonToCoords(updatedPlan.startLocation),
    finishLocation: geoJsonToCoords(updatedPlan.finishLocation),
  })
}

const deletePlan = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthenticatedError('Not authorized to access.')

  const userId = req.user.userId
  const planId = req.params.planId

  const result = await PlanSchema.findByIdAndDelete({
    _id: planId,
    userId,
  })

  if (!result) {
    throw new NotFoundError(`No plan with id ${planId}`)
  }

  // Remove all related records in bookmarks collection too
  await BookmarkSchema.deleteMany({
    planId,
  })

  res.status(StatusCodes.NO_CONTENT).end()
}

export { fetchAllPlans, createNewPlan, fetchPlan, updatePlan, deletePlan }
