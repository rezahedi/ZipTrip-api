import { transformGooglePlaceToSchema } from './../utils/googlePlace'
import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import PlaceSchema, { IPlace } from '../models/Places'
import { geoJsonToCoords } from '../utils/location'
import GooglePlaceSchema, { IGooglePlace } from '../models/GooglePlaces'
import CustomAPIError from '../errors/custom_error'
import { v2 as cloudinary } from 'cloudinary'

const PLACES_MAX_LIMIT = 50
const GOOGLE_PLACE_FETCH_VERSION = 4
const PLACE_IMG_UPLOAD_MAX_COUNT = 1

const fetchAllPlaces = async (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({})
}

const fetchPlace = async (req: Request, res: Response) => {
  const { placeId } = req.params

  const place: IPlace | null = await PlaceSchema.findOne({
    placeId,
  })
    .select(
      'placeId name state country imageURL address location type iconURL iconBackground summary reviewSummary rating userRatingCount'
    )
    .lean()

  if (!place) throw new CustomAPIError(`No place with id ${placeId}`, StatusCodes.NOT_FOUND)

  res.status(StatusCodes.OK).json({
    ...place,
    location: geoJsonToCoords(place.location),
  })
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
    .select('placeId name location type iconURL iconBackground')
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
  const existingPlace: IGooglePlace | null = await GooglePlaceSchema.findOne({
    googlePlaceId,
    version: GOOGLE_PLACE_FETCH_VERSION,
  }).lean()
  if (existingPlace) {
    const data = JSON.parse(existingPlace.data)
    res.status(StatusCodes.OK).json(transformGooglePlaceToSchema(data))
  } else {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY as string
    if (!apiKey) throw new CustomAPIError('Google Places API key is not configured', StatusCodes.INTERNAL_SERVER_ERROR)
    const fields =
      'id,displayName,shortFormattedAddress,formattedAddress,addressComponents,location,icon_mask_base_uri,photos,primaryType,iconBackgroundColor,editorialSummary,generativeSummary,reviewSummary,rating,userRatingCount'
    const url = `https://places.googleapis.com/v1/places/${googlePlaceId}?fields=${fields}&key=${apiKey}`

    const response = await fetch(url)
    if (response.ok) {
      const data = await response.json()

      if (data.photos.length > 0) {
        // if exist get maximum 4 images and store it in Cloudinary
        for (let i = 0; i < data.photos.length && i < PLACE_IMG_UPLOAD_MAX_COUNT; i++) {
          if ('name' in data.photos[i]) {
            const imageURL = `https://places.googleapis.com/v1/${data.photos[i].name}/media?maxHeightPx=400&maxWidthPx=400&key=${process.env.GOOGLE_MAPS_API_KEY}`
            const { secure_url } = await cloudinary.uploader.upload(imageURL, {
              folder: 'ZipTrip/Places',
              overwrite: true,
              invalidate: true,
            })
            data.photos[i].imageURL = secure_url
          }
        }
      }

      // Insert if placeId not found
      // Update if version was different
      await GooglePlaceSchema.updateOne(
        {
          googlePlaceId,
          version: { $ne: GOOGLE_PLACE_FETCH_VERSION },
        },
        {
          $set: {
            version: GOOGLE_PLACE_FETCH_VERSION,
            data: JSON.stringify(data),
          },
        },
        { upsert: true }
      )
      res.status(StatusCodes.OK).json(transformGooglePlaceToSchema(data))
    } else {
      throw new CustomAPIError('Failed to fetch place from Google Places API', StatusCodes.INTERNAL_SERVER_ERROR)
    }
  }
  res.status(StatusCodes.OK).json({ googlePlaceId })
}

export { fetchAllPlaces, fetchPlace, fetchAllNearbyPlaces, fetchGooglePlace }
