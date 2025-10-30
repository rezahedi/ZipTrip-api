import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import PlanSchema from '../models/Plans'
import PlaceSchema from '../models/Places'
import { geoJsonToCoords } from '../utils/location'
import { attachBookmarkFlagToPlans } from './util'

const PLANS_MAX_LIMIT = 20
const PLACES_MAX_LIMIT = 40

const fetchAllNearby = async (req: Request, res: Response) => {
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
    .select('title images cities stopCount type rate reviewCount startLocation distance duration')
    .populate('userId', 'name')
    .lean()

  const authenticatedUserId = req.user ? req.user.userId : ''
  const plansWithBookmarksStatus = await attachBookmarkFlagToPlans(plans, authenticatedUserId)

  const places = await PlaceSchema.find({
    location: {
      $geoWithin: {
        $geometry: withinBoundingBox,
      },
    },
  })
    .select('placeId name location type iconURL iconBackground')
    .limit(PLACES_MAX_LIMIT)
    .lean()

  res.status(StatusCodes.OK).json({
    count: plansWithBookmarksStatus.length + places.length,
    items: [
      ...plansWithBookmarksStatus.map((item) => ({
        type: 'plan',
        item: {
          ...item,
          startLocation: geoJsonToCoords(item.startLocation),
        },
      })),
      ...places.map((item) => ({
        type: 'place',
        item: {
          ...item,
          location: geoJsonToCoords(item.location),
        },
      })),
    ],
  })
}

export { fetchAllNearby }
