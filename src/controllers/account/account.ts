import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import PlanSchema, { IPlan } from '../../models/Plans'
import BookmarkSchema from '../../models/Bookmarks'
import PlaceSchema, { IPlace } from '../../models/Places'
import CustomAPIError from '../../errors/custom_error'
import NotFoundError from '../../errors/not_found'
import UnauthenticatedError from '../../errors/unauthentication_error'
import { coordsToGeoJson, geoJsonToCoords } from '../../utils/location'
import CitySchema, { ICity } from '../../models/Cities'
import { Types } from 'mongoose'

type PlaceDTO = Omit<IPlace, 'location' | 'createdAt' | 'updatedAt'> & {
  location: [number, number]
}

type CityDTO = Omit<ICity, 'imageURL' | 'location' | 'plans' | 'createdAt' | 'updatedAt'>

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
    .select('title images cities stopCount type rate reviewCount startLocation finishLocation distance duration')
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
  let { stops, cities, ...plan } = req.body

  // Insert cities in Cities collection if placeId does not exist
  // Increment plan's count in Cities Collection if placeId exist
  if (cities && cities.length > 0) {
    const ops = cities.map((city: CityDTO) => ({
      updateOne: {
        filter: { placeId: city.placeId },
        update: {
          $inc: { plans: 1 }, // increase plans if exists
          $setOnInsert: {
            // only set these when inserting
            ...city,
          },
        },
        upsert: true, // only insert if not exist
      },
    }))
    await CitySchema.bulkWrite(ops)

    plan.cities = cities
  }

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

  const plan = await PlanSchema.aggregate([
    {
      $match: { userId, _id: new Types.ObjectId(planId) },
    },
    {
      $project: {
        title: 1,
        description: 1,
        images: 1,
        cities: 1,
        stopCount: 1,
        stops: 1,
        type: 1,
        rate: 1,
        reviewCount: 1,
        startLocation: 1,
        finishLocation: 1,
        distance: 1,
        duration: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    {
      $lookup: {
        from: 'cities', // name of the Cities collection
        localField: 'cities.placeId',
        foreignField: 'placeId',
        as: 'cities', // NOTE: If need the exact cities order, save as cityDetails and uncomment the mapping stage below, otherwise it may change the order of added cities!
      },
    },
    // {
    //   $addFields: {
    //     cities: {
    //       $map: {
    //         input: '$cities',
    //         as: 'c',
    //         in: {
    //           $mergeObjects: [
    //             '$$c',
    //             {
    //               $arrayElemAt: [
    //                 {
    //                   $filter: {
    //                     input: '$cityDetails',
    //                     as: 'inputCity',
    //                     cond: { $eq: ['$$inputCity.placeId', '$$c.placeId'] },
    //                   },
    //                 },
    //                 0,
    //               ],
    //             },
    //           ],
    //         },
    //       },
    //     },
    //   },
    // },
  ])
  if (plan.length === 0) throw new NotFoundError(`No plan with id ${planId}`)

  res.status(StatusCodes.OK).json({
    ...plan[0],
    cities: plan[0].cities.map((city: ICity) => ({ ...city, location: geoJsonToCoords(city.location) })),
    startLocation: geoJsonToCoords(plan[0]?.startLocation),
    finishLocation: geoJsonToCoords(plan[0]?.finishLocation),
  })
}

const updatePlan = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthenticatedError('Not authorized to access.')

  const userId: string = req.user.userId
  const planId = req.params.planId

  let { stops, ...plan } = req.body

  if (stops) {
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
    if (ops.length > 0) await PlaceSchema.bulkWrite(ops)

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
