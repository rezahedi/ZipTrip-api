import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import PlaceSchema, { IPlace } from '../models/Places'
import { geoJsonToCoords } from '../utils/location'
import GooglePlaceSchema, { IGooglePlace } from '../models/GooglePlaces'
import CustomAPIError from '../errors/custom_error'

const PLACES_MAX_LIMIT = 50
const GOOGLE_PLACE_FETCH_VERSION = 1

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
    .limit(PLACES_MAX_LIMIT)
    .lean()

  res.status(StatusCodes.OK).json({
    count: places.length,
    items: places.map((item: IPlace) => ({
      ...item,
      location: geoJsonToCoords(item.location),
    })),
  })
}

const fetchGooglePlace = async (req: Request, res: Response) => {
  // Check if the place is already in our db
  const { googlePlaceId } = req.params
  const existingPlace: IGooglePlace | null = await GooglePlaceSchema.findOne({ googlePlaceId }).lean()
  if (existingPlace) {
    res.status(StatusCodes.OK).json(JSON.parse(existingPlace.data))
  } else {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY as string
    if (!apiKey) throw new CustomAPIError('Google Places API key is not configured', StatusCodes.INTERNAL_SERVER_ERROR)
    const fields = 'id,displayName,formattedAddress,icon_mask_base_uri,photos,rating'
    const url = `https://places.googleapis.com/v1/places/${googlePlaceId}?fields=${fields}&key=${apiKey}`

    const response = await fetch(url)
    if (response.ok) {
      const data = await response.json()
      await GooglePlaceSchema.create({
        googlePlaceId,
        version: GOOGLE_PLACE_FETCH_VERSION,
        data: JSON.stringify(data),
      })
      res.status(StatusCodes.OK).json(data)
    } else {
      throw new CustomAPIError('Failed to fetch place from Google Places API', StatusCodes.INTERNAL_SERVER_ERROR)
    }
  }
  res.status(StatusCodes.OK).json({ googlePlaceId })
}

export { fetchAllPlaces, fetchPlace, fetchAllNearbyPlaces, fetchGooglePlace }
