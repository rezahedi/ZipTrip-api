import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import PlaceSchema, { IPlace } from '../models/Places'
import { geoJsonToCoords } from '../utils/location'

const fetchAllPlaces = async (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({})
}

const fetchPlace = async (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({})
}

const fetchAllNearbyPlaces = async (req: Request, res: Response) => {
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

  const places = await PlaceSchema.find({
    location: {
      $geoWithin: {
        $geometry: withinBoundingBox,
      },
    },
  })
    .select('name imageURL address location')
    .lean()

  res.status(StatusCodes.OK).json({
    count: places.length,
    items: places.map((item: IPlace) => ({
      ...item,
      location: geoJsonToCoords(item.location),
    })),
  })
}

export { fetchAllPlaces, fetchPlace, fetchAllNearbyPlaces }
