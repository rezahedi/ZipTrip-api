import { coordsToGeoJson } from './../utils/location'
import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import CitySchema, { ICity } from '../models/Cities'
import PlanSchema, { IPlan } from '../models/Plans'
import BookmarkSchema from '../models/Bookmarks'
import NotFoundError from '../errors/not_found'
import CustomAPIError from '../errors/custom_error'
import { geoJsonToCoords } from '../utils/location'
import { v2 as cloudinary } from 'cloudinary'
import { AddressComponents } from '../types/googlePlaces'

const PAGE_SIZE = 10
const SORT = '-plans'

const fetchAllCities = async (req: Request, res: Response) => {
  const { search, cityId, page = '1', size = PAGE_SIZE, sort = SORT } = req.query

  const filters = {
    ...(search && {
      name: { $regex: search, $options: 'i' },
    }),
    ...(cityId && { placeId: cityId }),
  }

  const pageSize: number = parseInt(size as string)
  const pageNumber: number = (parseInt(page as string) - 1) * pageSize

  const totalItems = await CitySchema.countDocuments(filters)
  const pagesCount = Math.ceil(totalItems / pageSize)

  const cities = await CitySchema.find(filters)
    .select('placeId name state country imageURL plans')
    .skip(pageNumber)
    .limit(pageSize)
    .sort(sort as string)
    .lean()

  res.status(StatusCodes.OK).json({
    ...{ search, cityId },
    sort,
    page: parseInt(page as string),
    size: pageSize,
    pagesCount,
    items: cities.map((item) => ({
      ...item,
      location: geoJsonToCoords(item.location),
    })),
  })
}

const fetchCityWithPlans = async (req: Request, res: Response) => {
  const { cityId } = req.params
  const { page = '1', size = PAGE_SIZE } = req.query

  const pageSize: number = parseInt(size as string)
  const pageNumber: number = (parseInt(page as string) - 1) * pageSize

  const city: ICity | null = await CitySchema.findOne({ placeId: cityId })
    .orFail(new NotFoundError(`Item not found with the id: ${cityId}`))
    .select('placeId name state country imageURL location viewport')
    .lean()

  // Fetch city details from Google Places API for the first time call
  if (!city?.country && !city?.location) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY as string
    if (!apiKey) throw new CustomAPIError('Google Places API key is not configured', StatusCodes.INTERNAL_SERVER_ERROR)
    const fields = 'displayName,photos,location,viewport,addressComponents'
    const url = `https://places.googleapis.com/v1/places/${cityId}?fields=${fields}&key=${apiKey}`

    const response = await fetch(url)
    if (response.ok) {
      const data = await response.json()

      // Get Image and Store it
      let imageURL = city?.imageURL
      if (!city?.imageURL && data.photos.length > 0) {
        // Get first photo and generate the url
        imageURL = `https://places.googleapis.com/v1/${data.photos[0].name}/media?maxHeightPx=400&maxWidthPx=400&key=${process.env.GOOGLE_MAPS_API_KEY}`
        // Then upload the image on Cloudinary and get back the new image URL
        const { secure_url } = await cloudinary.uploader.upload(imageURL, {
          folder: 'ZipTrip/Places',
          overwrite: true,
          invalidate: true,
        })
        imageURL = secure_url
      }

      // Short Name
      const name = data.displayName.text

      // Get State
      const stateComponent = data.addressComponents.find((c: AddressComponents) =>
        c.types.includes('administrative_area_level_1')
      )
      const state = stateComponent.longText || ''

      // Get Country
      const countryComponent = data.addressComponents.find((c: AddressComponents) => c.types.includes('country'))
      const country = countryComponent.longText || ''

      // Map Viewport
      const viewport = {
        low: [data.viewport.low.latitude, data.viewport.low.longitude],
        high: [data.viewport.high.latitude, data.viewport.high.longitude],
      }

      // Then update the city document in Mongodb with new data
      await CitySchema.updateOne(
        { placeId: cityId },
        {
          $set: {
            ...(name && { name }),
            imageURL,
            viewport,
            ...(state && { state }),
            ...(country && { country }),
            location: coordsToGeoJson([data.location.latitude, data.location.longitude]),
          },
        }
      )
    }
  }

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
    ...city,
    location: geoJsonToCoords(city?.location),
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
